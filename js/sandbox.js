function sandboxInvoke(win, fnName, args) {
    return new Promise((resolve, reject) => {
        var message = {
            id: `${sandbox.id}${sandbox.invokeId++}`,
            command: 'invoke',
            context: JSON.stringify({
                Config: Espruino.Config,
                Core_Env: {
                    board: Espruino.Core.Env.getBoardData(),
                    data: Espruino.Core.Env.getData()
                }
            }),
            fnName,
            args
        };

        const setupListener = id => {
            const listener = (event) => {
                var data = event.data;
                if (data.id !== id) return;

                window.removeEventListener('message', listener);

                var command = data.command;
                switch(command) {
                    case 'resolve':
                        resolve(JSON.parse(data.result));
                        break;
                    case 'reject':
                        reject(JSON.parse(data.result));
                        break;
                }
            };

            window.addEventListener('message', listener);
        };

        console.log('sandbox:msg', message.id, message.command, message.fnName, message);

        setupListener(message.id);
        win.postMessage(message, '*');
    });
}


function sandboxWrapListener(event) {
    // 'null' is when originated from the sandboxed iframe
    var origin = event.origin == 'null' ? '*' : event.origin;
    var data = event.data;
    var command = data.command;

    switch(command) {
        case 'invoke':
            sandbox.context = JSON.parse(data.context);
            sandbox.callerWindow = event.source;

            var postReply = (command, result) => {
                var message = {
                    id: data.id,
                    command,
                    result: JSON.stringify(result)
                };

                console.log('sandbox:rpl', message.id, message.command, message);
                sandbox.callerWindow.postMessage(message, origin);
            };

            sandbox.wrapped[data.fnName](...data.args)
                .then(result => postReply('resolve', result))
                .catch(error => postReply('reject',  error.toString()));
    }
}

window.addEventListener('message', sandboxWrapListener);


var sandbox = {
    id: 'sandbox',
    invokeId: 0,

    wrapped: {},
    callerWindow: window,

    wrap(fnName, fn) {
        this.wrapped[fnName] = fn;
        return sandbox;
    },
    invoke(win, fnName, ...args) {
        return sandboxInvoke(win, fnName, args);
    }
};
