// Requires the global `AD` object
"use strict";

/**
 * CSRF object for internal use only.
 */
var CSRF = {
    token: null,
    /**
     * Fetch the user's CSRF token from sails.js
     * @return Deferred
     *    Resolves with the CSRF token string when it has been fetched
     */
    fetch: function () {
        var dfd = AD.sal.Deferred();
        AD.sal.http({
            type: 'GET',
            url: '/csrfToken',
            dataType: 'json',
            cache: false
        })
        .done(function (data, status, res) {
            CSRF.token = data._csrf;
            dfd.resolve(CSRF.token);
        })
        .fail(function (res, status, err) {
            var csrfError = new Error('Unable to get CSRF token: ' + err.message);
            console.log(csrfError);
            dfd.reject(csrfError);
            //dfd.resolve(null);
        });
        return dfd;
    }
};

/**
 * Track the server state when it goes down during reloading
 * @private
 */
var _isServerReady = true;

/*
// The JS library load order is not consistent. Work around that
// by waiting for socket.io with setTimeout.
AD.waitFor('io', function() {
    io.socket.on('server-reload', function(data) {
    //AD.comm.socket.subscribe('server-reload', function(data) {
        if (data.reloading) {
            console.log('Server is now reloading');
            _isServerReady = false;
        } else {
            console.log('Server has finished reloading');
            _isServerReady = true;
            if (!AD.ui.reauth.inProgress()) {
                AD.comm.pending.process();
            }
        }
    });
});
*/

/**
 * Check if the server is currently ready to handle requests.
 * @return boolean
 */
export function isServerReady() {
    return _isServerReady;
};


export function csrf() {
    var dfd = AD.sal.Deferred();

    // Fetch CSRF token if needed
    if (!CSRF.token) {
        CSRF.fetch()
            .done(function () {
                dfd.resolve(CSRF.token);
            })
            .fail(dfd.reject);
    } else {
        dfd.resolve(CSRF.token);
    }

    return dfd;
};

/**
 * context()
 * @private
 *
 * simple options builder for building the context of the current request
 */
function context(options, cb, dfd) {
    return { request: request, opts: options, cb: cb, dfd: dfd };
}


/**
 * @function request()
 * @private
 *
 * Make an HTTP request asynchronously.
 *
 * @param {String} options.method
 *    [optional] The HTTP verb to use. Default is POST.
 * @param {String} options.url
 *    The URL to post the request to.
 * @param {Object} options.params
 *    An associative array of field names and values to post.
 * @param {Function} options.complete
 *    The callback function to execute after the request is completed,
 *    before checking whether or not it succeeded or failed.
 * @param {Function} options.success
 *    The callback function to execute if the request is successful.
 * @param {Function} options.failure
 *    The callback function to execute if the request failed.
 *
 * @return Deferred
 */
function request(options, cb) {
    var dfd = AD.sal.Deferred();

    // Default is async, but you can specify 'sync: true' in the options
    // to change to sync mode instead.
    var asyncMode = true;
    if (options.sync) {
        asyncMode = false;
    }
    options.method = options.method || 'POST';

    // The documented option key is 'params', but 'data' will also
    // be accepted.
    if (!options.params && options.data) {
        options.params = options.data;
    }

    // Fetch CSRF token if needed
    if (!CSRF.token && options.method != 'GET') {
        CSRF.fetch()
            .done(function () {
                // Resubmit request after getting token
                request(options, cb)
                    .done(dfd.resolve)
                    .fail(dfd.reject);
            })
            .fail(dfd.reject);
        return dfd;
    }


    // if we are currently in process of authenticating, then
    // queue request
    if (AD.ui.reauth.inProgress() || !AD.comm.isServerReady()) {

        // make sure this isn't our local auth submission:
        if (!((options.method == 'POST')&&(options.url=='/site/login'))) {

            AD.comm.pending.add(context(options, cb, dfd));
            // pendingRequests.push({ opts:options, cb:cb, dfd:dfd });
            return dfd;
        }
    }


    AD.sal.http({
        async: asyncMode,
        url: options['url'],
        type: options['method'],
        contentType: options['contentType'],
        dataType: 'json',
        data: options['params'],
        headers: {
            'X-CSRF-Token': CSRF.token
        },
        cache: false
    })
        .fail(function (req, status, statusText) {
            req.responseText = req.responseText || '';
            
            // was this a CSRF error?
            if (req.responseText.toLowerCase().indexOf('csrf') != -1) {

                // reset our CSRF token
                CSRF.token = null;

                // resubmit the request 
                request(options, cb)
                    .done(dfd.resolve)
                    .fail(dfd.reject);
                return;
            }



            // check to see if responseText is our json response
            var data;
            try {
                data = AD.sal.parseJSON(req.responseText);
            } catch (err) {
                console.log('JSON text:', req.responseText);
                console.log('Parse error:', err);
                data = null;
            }
            
            if (('object' == typeof data) && (data != null)) {

                if ('undefined' != typeof data.status) {

                    // this could very well be one of our messages:
                    // _handleAppdevError( data );
                    AD.comm.error(data, context(options, cb, dfd));
                    return;
                };
            }

            // Serious error where we did not even get a JSON response
            AD.comm.hub.publish('ad.err.notification', data);
            if (cb) {
                cb(data);
            }
            dfd.reject(data);
        })
        .done(function (data, textStatus, req) {

            // Got a JSON response but was the service response an error?
            if (data.status && (data.status == 'error')) {

                // _handleAppdevError( data );
                AD.comm.error(data, context(options, cb, dfd));
                return;
            }
            // Success!
            else {

                // if this was an appdev packet, only return the data:
                if (data.status && data.status == 'success') {
                    data = data.data;
                }


                if (cb) cb(null, data);
                dfd.resolve(data);
            }


        }); // ajax()


    return dfd;

} // request()


export var service = {
    get(options, cb) {
        options['method'] = 'GET';
        return request(options, cb);
    },

    post(options, cb) {
        options['method'] = 'POST';
        return request(options, cb);
    },

    put(options, cb) {
        options['method'] = 'PUT';
        return request(options, cb);
    },

    'delete': (options, cb) => {
        options['method'] = 'DELETE';
        return request(options, cb);
    },
};
