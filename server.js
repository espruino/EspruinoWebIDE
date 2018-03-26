#!/usr/bin/node
/** BETA Node.js server that allows Web IDE to be served off of a website.

Only one concurrent connection allowed at the moment.

Just start with `node server.js`, then navigate to `localhost:8080` in a web browser.
The Web IDE should start up over the network and work like normal.

*/
var Espruino = { Config : {}, Core : {}, Plugins : {} };
var SERVER_PORT = 8080;
Espruino.Config.BLUETOOTH_LOW_ENERGY = true;

// ----------------------------------------------------
function help() {
  console.log("Espruino Web IDE Server");
  console.log("   USAGE:");
  console.log("      --help        This help screen");
  console.log("      --port ###    Listen on the given port (default 8080)");
  process.exit(0);
}
// ---------------------------------------------------- arg parsing
for (var i=2;i<process.argv.length;i++) {
  var arg = process.argv[i];
  if (arg=="--port") {
    SERVER_PORT = parseInt(process.argv[++i]);
    if (!(SERVER_PORT>0 && SERVER_PORT<65536)) {
      console.log("Invalid port "+JSON.stringify(process.argv[i]));
      help();
    }
  } else {
    if (arg!="--help") console.log("Unknown argument "+arg);
    help();
  }
}
// ----------------------------------------------------


var WebSocketServer = require('websocket').server;
var http = require('http');
var connection;

Espruino.callProcessor = function(a,b,cb) { cb(); }
Espruino.Core.Status = {
 setStatus : function(t,l) { console.log(":"+t); },
 incrementProgress : function(amt) {}
};

function readEspruinoToolsFile(p) {
  return require("fs").readFileSync(__dirname+"/EspruinoTools/"+p).toString();
}
eval(readEspruinoToolsFile("core/utils.js"));
eval(readEspruinoToolsFile("core/serial.js"));
eval(readEspruinoToolsFile("core/serial_node_serial.js"));
eval(readEspruinoToolsFile("core/serial_noble.js"));

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

Espruino.Core.Serial.startListening(function(data) {
  if (connection) connection.sendUTF("\x00"+ab2str(data));
});

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' HTTP '+request.method+' ' + request.url);
    var url = request.url.toString();
    // ignore query string
    if (url.indexOf("?")>=0)
      url = url.substr(0,url.indexOf("?"));
    // special files
    if (url == "/") url = "/main.html";
    if (url == "/serial/ports") {
      Espruino.Core.Serial.getPorts(function(ports) {
        response.writeHead(200);
        response.end(JSON.stringify(ports,null,2));
      });
      return;
    }
    // load filesystem file
    var path =  require('path').resolve(__dirname, "."+url);
    if (path.substr(0,__dirname.length)!=__dirname) {
      console.warn("Hacking attempt? ", url);
      response.writeHead(404);
      response.end();
      return;
    }

    if (require("fs").existsSync(path)) {
      //console.log("Serving file ",path);
      require("fs").readFile(path, function(err, blob) {
        var mime;
        if (path.substr(-4)==".css") mime = "text/css";
        if (path.substr(-5)==".html") mime = "text/html";
        if (path.substr(-4)==".png") mime = "image/png";
        if (path.substr(-4)==".js") mime = "text/javascript";
        if (mime) response.setHeader("Content-Type", mime);
        if (url == "/main.html") {
          // make sure we load the websocket library

          blob = blob.toString();
          if (blob.indexOf("<!-- SERIAL_INTERFACES -->")<0) throw new Error("Expecing <!-- SERIAL_INTERFACES --> in main.html");
          blob = blob.replace("<!-- SERIAL_INTERFACES -->", '<script src="EspruinoTools/core/serial_websocket_relay.js"></script>');
        }

        response.writeHead(200);
        response.end(blob);
      });
      return;
    }

    console.log(path);
    response.writeHead(404);
    response.end();
});

server.listen(SERVER_PORT, function() {
    console.log((new Date()) + ' Server is listening on port '+SERVER_PORT);
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      try { request.reject(); } catch (e) {}
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    if (request.httpRequest.url[0]!="/") {
      try { request.reject(); } catch (e) {}
      console.log("Invalid connection URL "+request.httpRequest.url);
      return;
    }
    var device = request.httpRequest.url.substr(1);
    Espruino.Core.Serial.open(device, function(ok) {
      if (!ok) {
        request.reject();
        console.log("Failed to open port");
        return;
      }
      /* force slow write off. Slow write is the problem of the Web IDE
      running on the client :) */
      Espruino.Core.Serial.setSlowWrite(false, true);
      connection = request.accept('serial', request.origin);
      console.log((new Date()) + ' Connection accepted.');
      connection.on('message', function(message) {
        var d = message.utf8Data;
        console.log('Received Message: ' + message.type + " - " + JSON.stringify(d));
        if (d[0]=="\x01") { // IDE -> BLE
          Espruino.Core.Serial.write(d.substr(1), false, function() {
            connection.sendUTF("\x02"); // send write ack
          });
        }
      });
      connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer disconnected.');
        Espruino.Core.Serial.close();
        connection = undefined;
      });
    }, function() {
      if (connection) connection.close();
      console.log(device + " Disconnected");
      connection = undefined;
    });
});
