sandbox.id = 'rollup';
sandbox.wrap('Espruino.Core.Utils.getURL', url => new Promise((resolve, reject) => {
    Espruino.Core.Utils.getURL(url, data => data ? resolve(data) : reject(undefined));
}));
sandbox.wrap('Espruino.callProcessor', (processor, data) => new Promise((resolve, reject) => {
    Espruino.callProcessor(processor, data, result => result ? resolve(result) : reject(undefined));
}));

var rollupWindow = document.getElementById('rollup').contentWindow;
window.rollupTools = {
    loadModulesRollup: code => sandbox.invoke(rollupWindow, 'rollupTools.loadModulesRollup', code),
    minifyCodeTerser: code => sandbox.invoke(rollupWindow, 'rollupTools.minifyCodeTerser', code),
};
