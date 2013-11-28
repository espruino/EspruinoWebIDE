/** Wrapper around the new API appearing in Chome M33, to allow us to be backwards compatible.

    By Ken Rockot
 */
(function() {
  if (chrome.serial.getPorts) {
    return;
  }

  var connections = {};
  
  chrome.serial.getPorts = function(callback) {
    chrome.serial.getDevices(function(devices) {
      callback(devices.map(function(device) {
        return device.path;
      }));
    });
  };

  chrome.serial.open = function(path, options, callback) {
    if (options.dataBit === 'sevenbit')
      options.dataBits = 'seven';
    else if (options.dataBit === 'eightbit')
      options.dataBits = 'eight';
    if (options.stopBit === 'onestopbit')
      options.stopBits = 'one';
    else if (options.stopBits === 'twostopbit')
      options.stopBits = 'two';
    if (options.parityBit)
      options.parityBit = options.parityBit.replace('parity', '');
    chrome.serial.connect(path, options, function(connectionInfo) {
      if (!connectionInfo) {
        callback({ connectionId: -1 });
      } else {
        connections[connectionInfo.connectionId] = {
          buffers: [],
          waitQueue: []
        };
        callback(connectionInfo);
      }
    });
  };

  chrome.serial.close = chrome.serial.disconnect;
  
  chrome.serial.write = function(id, data, callback) {
    chrome.serial.send(id, data, function(sendInfo) {
      if (sendInfo.error && sendInfo.bytesSent === 0) {
        callback({ bytesWritten: -1 });
      } else {
        callback({ bytesWritten: sendInfo.bytesSent });
      }
    });
  };

  chrome.serial.read = function(id, count, callback) {
    if (!connections.hasOwnProperty(id)) {
      callback({ bytesRead: -1, data: null });
      return;
    }
    var bytesRead = 0;
    var outBuffers = [];
    var buffers = connections[id].buffers;
    var remainder = null;
    if (buffers.length === 0) {
      connections[id].waitQueue.push({ count: count, callback: callback });
      return;
    }
    if (buffers[i].bytesRead < 0) {
      callback({ bytesRead: -1, data: null });
      return;
    }
    // Try to read exactly |count| bytes. Underrun is accepted; overrun is
    // placed back into the read queue.
    for (var i = 0; i < buffers.length && count > 0 && buffers[i].bytesRead >= 0; ++i) {
      if (buffers[i].byteLength <= count) {
        count -= buffers[i].byteLength;
        bytesRead += buffers[i].byteLength;
        outBuffers.push(buffers[i]);
      } else {
        outBuffers.push(buffers[i].slice(0, count));
        remainder = buffers[i].slice(count);
        bytesRead += count;
        count = 0;
      }
    }
    buffers = buffers.slice(i);
    if (remainder)
      buffers.splice(0, 0, remainder);
    var output = new Uint8Array(new ArrayBuffer(bytesRead));
    var outputIndex = 0;
    for (var i = 0; i < outBuffers.length; ++i) {
      var bytes = new Uint8Array(outBuffers[i]);
      for (var j = 0; j < bytes.length; ++j, ++outputIndex) {
        output[outputIndex] = bytes[j];
      }
    }
    callback({ bytesRead: bytesRead, data: output.buffer });
  };

  chrome.serial.onReceive.addListener(function(receiveInfo) {
    if (connections.hasOwnProperty(receiveInfo.connectionId)) {
      var connection = connections[receiveInfo.connectionId];
      var bytes = new Uint8Array(receiveInfo.data);
      connection.buffers.push({
        bytesRead: bytes.length,
        data: bytes.buffer
      });
      // Attempt to flush the wait queue
      var queue = connection.waitQueue.slice();
      connection.waitQueue = [];
      queue.forEach(function(entry) {
        chrome.serial.read(receiveInfo.connectionId, entry.count, entry.callback);
      });
    }
  });

  chrome.serial.onReceiveError.addListener(function(errorInfo) {
    if (connections.hasOwnProperty(errorInfo.connectionId)) {
      connections[errorInfo.connectionId].buffers.push({
        bytesRead: -1,
        data: null
      });
    }
  });
}());
