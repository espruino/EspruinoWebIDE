/* Point EspruinoIDE at an iframe with src="https://espruino.com/ide"
to allow that iframe to have transmit/receive access via the returned
structure.

Use for (for example) serving up the IDE directly from an Espruino board.
*/

function EspruinoIDE(ideframe) {
  function post(msg) {
    msg.for="ide";
    ideframe.contentWindow.postMessage(msg,"*");
  }
  window.addEventListener('message', function(e) {
    var event = e.data;
    if (typeof event!="object" || event.from!="ide") return;
    //console.log("HOST MESSAGE ---------------------------------------");
    //console.log(event);
    //console.log("-----------------------------------------------");

    switch (event.type) {
      case "init":
        console.log("IDE frame initialised");
        if (Espruino.onready)
          Espruino.onready();
        break;
      case "getPorts": // get port data
        post({type:"ports",data: Espruino.onports?Espruino.onports():[]});
        break;
      case "connect": // request to connect
        post({type:"connected"}); // let's just say we were connected immediately
        break;
      case "disconnect": // request to disconnect
        post({type:"disconnected"}); // let's just say we were disconnected immediately
        if (Espruino.ondisconnect)
          Espruino.ondisconnect();
        break;
      case "write": // data to write
        if (typeof event.data!="string") throw new Error("write event should have been given a string");
        if (Espruino.onwritecb) {
          Espruino.onwritecb(event.data, function() {
            post({type:"written"});
          });
        } else {
          if (Espruino.onwrite)
            Espruino.onwrite(event.data);
          // post that we've written, but after a delay
          setTimeout(function() {
            post({type:"written"});
          }, 100);
        }
        break;
      default:
        console.error("Unknown event type ",event.type);
        break;
    }
  });
  var Espruino = {
    // tell the IDE to connect to the given port
    connect : function(port) {
      post({type:"connect",data:port});
    },
    // tell the IDE it's disconnected
    disconnect : function() {
      post({type:"disconnected"});
    },
    // Data received from device - d should be a string
    received : function(d) {
      if (typeof d!="string") throw new Error("Espruino.received should be given a string");
      post({type:"receive",data:d});
    },
    // called when the IDE is ready
    onready : undefined,
    // should return a list of available ports
    onports : undefined,
    // called with (data) when data should be written to the device
    onwrite : undefined,
    // called with (data,callback) when data should be written to the device. callback should be called when data has been written
    onwritecb : undefined,
    // called when the user requests a disconnect
    ondisconnect : undefined,
  };
  return Espruino;
}
