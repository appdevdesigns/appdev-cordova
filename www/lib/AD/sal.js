import $ from 'jquery';

export default {
    Deferred() {
        return $.Deferred();
    },
    
    http(options) {
        // Clone the options to avoid modifying the original
        var opts = {};
        $.extend(opts, options);
        
        if (window.AD && AD.config && AD.config.getValue) {
            var baseURL = AD.config.getValue('siteBaseURL');
            if (baseURL && opts.url && opts.url[0] == '/') {
                opts.url = baseURL + opts.url;
            }
        }
        
        // Send cookies with CORS requests
        opts.xhrFields = opts.xhrFields || {};
        opts.xhrFields.withCredentials = true;
        
        return $.ajax(opts);
    },
    
    parseJSON(text) {
        return $.parseJSON(text);
    },
    
    setImmediate(fn) {
        setTimeout(fn, 0);
    }
};
