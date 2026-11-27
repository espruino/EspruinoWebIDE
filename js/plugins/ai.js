/**
 Copyright 2014 Gordon Williams (gw@pur3.co.uk)

 This Source Code is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at http://mozilla.org/MPL/2.0/.

 ------------------------------------------------------------------
  AI Coding Plugin - provide an API for LLM/AIs, as well as WebMCP support
  (if enabled in browser)

  To enable in Chrome:

  chrome://flags/#enable-webmcp-testing

  TODO:

  * upload should strip out welcome banner
  * eval could return the value+console output separately if using the packet parsing code
  * Benchmark function
  * Screenshot function
 ------------------------------------------------------------------
**/
"use strict";
(function(){
  function log(msg, type = 'info') {
    if (msg.error) msg = msg.error.message;
    console.log("AI", msg);
    Espruino.Core.Terminal.addNotification(Espruino.Core.Utils.escapeHTML(msg).replaceAll("\n","<br/>"))
  }

  const DESCRIPTIONS = {
    devices : `Returns a Promise that resolves with an array of names of devices that can be connected
to without requiring any user input. If a Bluetooth or USB device has not been previously connected to
then it won't appear here and you'll have to prompt the user to connect manually.`,
    connect : `Connect to the device with the given name (in the list returned by \`devices\`. Returns
a promise that completes on success`,
    disconnect : `Disconnect from a currently connected device. Returns a promise, and always resolves even if
no device is connected`,
    info : `Return a Promise that resolves with an object containing useful information about the board,
such as what it is (\`device_id\`), what version software is on it  (\`version\`) and what JS modules it
provides (\`installed_modules\`), and what pins it has (\`pins\`). If no device is connected it'll reject
with an Error. \`url_for_more_information\` may also be set, which is a URL that contains specific information
regarding the connected device.`,
    eval : `Execute the given String as a JavaScript expression
on the REPL and return a Promise that resolves with the text that was written to the console while
it executed. The expression can change state of the currently running program - for instance sending
\`function a() {}\` will be able to overwrite the function \`a\``,
    upload: `Upload the given JavaScript code to the device's flash memory. It returns a promise which
completes with what was written to the REPL after the code has been uploaded and executed.`,
    display: `Display a message to the user in the IDE, in which you can use to explain what has been done and how to use the code that has been created`
  };
  const NOT_CONNECTED_MESSAGE = "The IDE is not connected to a device. Instruct the user to connect a device.";

  /** Generic API. Also useful for AIs like Claude that don't yet support WebMCP */
  Espruino.API = {
    help : () => `This is an API designed to allow easy access to Espruino devices.
This Web IDE does provide WebMCP (if enabled in the browser), but the methods
in Espruino.API can be used as well.

* \`Espruino.API.devices()\` ${DESCRIPTIONS.devices}
* \`Espruino.API.connect(device_name)\` ${DESCRIPTIONS.connect}
* \`Espruino.API.disconnect()\` ${DESCRIPTIONS.disconnect}
* \`Espruino.API.info()\` ${DESCRIPTIONS.info}
* \`Espruino.API.eval(javascript_string)\` ${DESCRIPTIONS.eval}
* \`Espruino.API.upload(javascript_string)\` ${DESCRIPTIONS.upload}
* \`Espruino.API.display(markdown)\` ${DESCRIPTIONS.display}
`,
    devices : () => new Promise(resolve => {
      Espruino.Core.Serial.getPorts(devices => {
        resolve(devices.filter(d=>!d.promptsUser).map(d=>d.path))
      }, {flatten:true})
    }),
    connect : device_name => new Promise((resolve,reject) => {
      if ((typeof device_name) != "string")
        return reject(new Error("`connect` must be called with a String"));
      if (Espruino.Core.Serial.isConnected())
        return reject(new Error("Already connected"));
      log(`Connecting to ${device_name}`, 'cmd');
      Espruino.Core.Serial.open(device_name, connection => {
        if (connection!==undefined && connection.error===undefined) { // connected
          resolve("Connected!");
        } else { // failed
          reject(new Error("Connection failed"));
        }
      }, () => {
        // disconnected
        reject(new Error("Disconnected"));
      })
    }),
    disconnect : device_name => new Promise((resolve,reject) => {
      if (!Espruino.Core.Serial.isConnected())
        return resolve(new Error("Already disconnected"));
      log(`Disconnecting from device`, 'cmd');
      Espruino.Core.Serial.close();
      setTimeout(resolve, 1000, "Disconnected");
    }),
    info : js => {
      if (!Espruino.Core.Serial.isConnected())
        return Promise.reject(new Error(NOT_CONNECTED_MESSAGE));
      var d = Espruino.Core.Env.getData();
      var inf = {
        device_id : d.BOARD,
        version : d.VERSION,
        installed_modules : d.MODULES,
        microcontroller : d.chip.part,
        pins : d.pins.map(p=>p.name).join(",")
      };
      if (d.info && d.info.name)
        inf.device_name = d.info.name;
      if (d.info && d.info.link && d.info.link.length>0)
        inf.url_for_more_information = d.info.link[0];
      return Promise.resolve(inf);
    },
    eval : js => {
      if (!Espruino.Core.Serial.isConnected())
        return Promise.reject(new Error(NOT_CONNECTED_MESSAGE));
      log(`Evaluating:\n${js}`, 'cmd');
      return new Promise(resolve => {
        let outputText = "";
        function onLine(l) {
          outputText += l + "\n";
        }
        Espruino.Core.Serial.connection.on("line",onLine);
        let code = Espruino.Core.CodeWriter.reformatCodeForREPL(js)+"\n";
        if (code.startsWith("\x10")) code = code.substring(1);
        Espruino.Core.Serial.write(code, false, function() {
          setTimeout(function() {
            Espruino.Core.Serial.connection.removeListener("line", onLine);
            //if (outputText.startsWith(">\x1B[?7l")) outputText = outputText.substring(6); // remove control characters from the start
            resolve(outputText);
          }, 1000);
        });
      });
    },
    upload : js => {
      if (!Espruino.Core.Serial.isConnected())
        return Promise.reject(new Error(NOT_CONNECTED_MESSAGE));
      log(`Uploading:\n${js}`, 'cmd');
      return new Promise(resolve => {
        let outputText = "";
        function onLine(l) {
          outputText += l + "\n";
        }
        Espruino.Core.Serial.connection.on("line",onLine);
        Espruino.Core.CodeWriter.writeToEspruino(js, function() {
          setTimeout(function() {
            Espruino.Core.Serial.connection.removeListener("line", onLine);
            if (outputText.startsWith(">\x1B[?7l"))
              outputText = outputText.substring(6); // remove control characters from the start
            resolve(outputText);
          },1000);
        });
      });
    },
    display : markdown => {
      log(`AI: ${Espruino.Core.HTML.markdownToHTML(markdown)}`, 'info');
    }
  };
  /*-------------*/

  function init() {
    // Adding MCP tools
    if (!document.modelContext) {
      console.log("No document.modelContext - WebMCP AI extensions not loaded, but `Espruino.API` can still be used by AI");
    } else {
      document.modelContext.registerTool({
        name: 'devices',
        description: DESCRIPTIONS.devices,
        inputSchema: {
          type: 'object',
          properties: { }
        },
        outputSchema: {
          type: "object",
          description: "an array of device names",
        },
        annotations: {
          readOnlyHint: true,
          consequentialHint: false
        },
        execute: async () => Espruino.API.devices(),
      });
      document.modelContext.registerTool({
        name: 'connect',
        description: DESCRIPTIONS.connect,
        inputSchema: {
          type: 'object',
          properties: {
            device_name: { type: 'string', description: "The name of a device to connect to, as returned by `devices`" }
          },
        },
        annotations: {
          readOnlyHint: false,
          consequentialHint: false
        },
        execute: async ({device_name}) => Espruino.API.connect(device_name),
      });
      document.modelContext.registerTool({
        name: 'disconnect',
        description: DESCRIPTIONS.disconnect,
        inputSchema: {
          type: 'object',
          properties: {},
        },
        annotations: {
          readOnlyHint: false,
          consequentialHint: false
        },
        execute: async () => Espruino.API.disconnect(),
      });
      document.modelContext.registerTool({
        name: 'info',
        description: DESCRIPTIONS.info,
        inputSchema: {
          type: 'object',
          properties: { }
        },
        outputSchema: {
          type: "object",
          //description: "...",
        },
        annotations: {
          readOnlyHint: true,
          consequentialHint: false
        },
        execute: async () => Espruino.API.info(),
      });
      document.modelContext.registerTool({
        name: 'eval',
        description: DESCRIPTIONS.eval,
        inputSchema: {
          type: 'object',
          properties: {
            js: { type: 'string', description: "A valid Espruino JavaScript expression to execute" }
          },
          required: ['js'],
        },
        outputSchema: {
          type: "string",
          description: "The devices's response to executing the expression supplied. This may be '=' followed by the result, or it may be something like an error message",
        },
        annotations: {
          readOnlyHint: false,
          consequentialHint: true
        },
        execute: async ({ js }) => await Espruino.API.eval(js)
      });
      document.modelContext.registerTool({
        name: 'upload',
        description: DESCRIPTIONS.upload,
        inputSchema: {
          type: 'object',
          properties: {
            js: { type: 'string', description: "Valid Espruino JavaScript code to save and run" }
          },
          required: ['js'],
        },
        outputSchema: {
          type: "string",
          description: "The devices's response to executing the code supplied",
        },
        annotations: {
          readOnlyHint: false,
          consequentialHint: true
        },
        execute: async ({ js }) => await Espruino.API.upload(js)
      });
      document.modelContext.registerTool({
        name: 'display',
        description: DESCRIPTIONS.display,
        inputSchema: {
          type: 'object',
          properties: {
            instructions: { type: 'string', description: "Markdown formatted instructions that explain to the user how to use the code that has been uploaded to the device" }
          },
          required: ['instructions'],
        },
        annotations: {
          readOnlyHint: false,
          consequentialHint: true
        },
        execute: async ({ instructions }) => await Espruino.API.display(instructions),
      });
    }
  }

  Espruino.Plugins.AI = {
    init : init,
  };
}());