// Under normal circumstances, this file should never get loaded. Instead,
// the server will run appdev-core/ADCoreController.js configData().

steal(
    'appdev/config/config.js',
    function () {

        var configValues = {
            authType: 'CAS'
        }


        for (var v in configValues) {
            AD.config.setValue(v, configValues[v]);
        }

    });