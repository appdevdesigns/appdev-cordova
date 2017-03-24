// Requires the global `AD` object
"use strict";

//import "lib/sails.io.js";


// track our socket.subscriptions here:
// format:
// [message]: {
// _all:[ cb, cb, cb],   // these cb's get called on all messages by message
// 'value': [cb, cb, cb] .. these cb's get called when there are values in the message that match 'value'
// examples:
// 'created': [cb],     // call when a verb: 'created'   is sent
// '16' : [cb]          // call when an id:16  is sent
//  }
var subscriptions = {};
var notified = {};

// subscriptionIDs keep track of our ids with the cb that reference
var subscriptionCount = 0;
var subscriptionIDs = {};


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
 * @param {jQuery} options.messageBox
 *    jQuery selection of the message box to display any error messages
 *    in. If not specified, then a dialog box will be used.
 * @param {String} options.showErrors
 *    "ON", "OFF", or "AUTO". Default is AUTO.
 *    Auto means errors will be shown unless a failure callback is
 *    provided.
 */
function request(options, cb) {
    var dfd = AD.sal.Deferred();

    if (!options.method) {
        options.method = 'post';
    }

    // if we are currently in process of authenticating, then
    // queue request
    if (AD.ui.reauth.inProgress() || !AD.comm.isServerReady()) {

        AD.comm.pending.add(context(options, cb, dfd));
        return dfd;
    }

    // this prevents our build process from crashing on undefined 'io'
    if (typeof io != "undefined") {
        io.socket[options.method](options.url, options.params, function (data, jwres) {

            console.log('AD.comm.socket.' + options.method + '() response:');
            console.log(data);
            console.log('jwres:');
            console.log(jwres);

            if (typeof data == 'string') {
                data = JSON.parse(data);
            }

            // if this is an  error
            if (jwres.statusCode >= 400) {

                AD.comm.error(data, context(options, cb, dfd));

                //     // some non framework related error ... 
                //     var err = new Error(jwres.toString());
                //     dfd.reject(err);  

            } else {
                // Got a JSON response but was the service response an error?
                if (data.status && (data.status == 'error')) {

                    AD.comm.error(data, context(options, cb, dfd));
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
            }

        });

    } // end if(io)

    return dfd;
}; // request


/*
 * @function processMessage
 * @private
 *
 * Process all messages coming back from our io.socket.on() subscriptions
 * and direct them to any of our more complex subscriptions.
 *
 * This fn() will attempt to narrow the messages down to message+verb
 * or message+value subscriptions.
 */
function processMessage(message, data) {
    console.log('...AD.comm.socket: process message:')
    console.log('... message:' + message);
    console.log('... data:', data);

    // if we have any subscriptions for message:
    if (subscriptions[message]) {
        var keyVerb = message + '.' + data.verb;
        var sub = subscriptions[message];

        // process any '_all' subscriptions:
        sub['_all'].forEach(function (cb) {
            cb(keyVerb, data);
        });

        // convert the values in data to an array:
        //// Question:  did I mean to do data  or data.data ?  
        ////            if all I wanted to do was capture { id: # } then why not simply 
        ////            pull data.id out and see if there is a subscription for that?
        ////
        var arryData = [];
        for (var d in data) {
            arryData.push(data[d]);
        }

        // now check each 'key' of subscription and see if it is in arryData
        for (var k in sub) {
            var keyKey = message + '.' + k;
            if (arryData.indexOf(k) != -1) {
                // found a match, so call those cb's:
                sub[k].forEach(function (cb) {
                    cb(keyKey, data);
                })
            }

            // special case:  if k is a number then search for that:
            if (AD.ui.jQuery.isNumeric(k)) {
                var kFloat = parseFloat(k);

                if (arryData.indexOf(kFloat) != -1) {
                    // found a match, so call those cb's:
                    sub[k].forEach(function (cb) {
                        cb(keyKey, data);
                    })
                }
            }
        }
    }
}


export default {
    get(options, cb) {
        options['method'] = 'get';
        return request(options, cb);
    },

    post(options, cb) {
        options['method'] = 'post';
        return request(options, cb);
    },

    put(options, cb) {
        options['method'] = 'put';
        return request(options, cb);
    },

    'delete': (options, cb) => {
        options['method'] = 'delete';
        return request(options, cb);
    },

    /*
     * @function subscribe
     *
     *  Subscribe to messages from the socket.
     *
     *  @codestart
     *      var subscriptionID = AD.comm.socket.subscribe('TVShow.Created', function(message, data) {
     *          //add entry contained in data to list
     *          listWidget.addEntry(data);
     *      });
     *  @codeend
     */
    subscribe(key, cb) {

        // we want to be able to provide a [message].[value] combo here to allow 
        // subscriptions to models like:  model.verb,  user.created,  user.deleted, etc...

        // io.socket.on()  only understands the first level of the message:  [message]
        // 

        // first take the 'key' and split it up into parts:
        var keyParts = key.split('.');

        var message = keyParts[0].toLowerCase();
        var verb = '_all';
        if (keyParts[1]) verb = keyParts[1].toLowerCase();


        // if there are no messages registered:
        // create the message container:
        if (!subscriptions[message]) {
            subscriptions[message] = {
                '_all': []
            }
        }

        // if message.verb is registered
        if (subscriptions[message][verb]) {

            // add to cb array
            subscriptions[message][verb].push(cb);

        } else {// else 

            // create cb array for message.verb
            subscriptions[message][verb] = [cb];
        }


        // now if we have not already registered message with io.socket
        if (!notified[message]) {
            // console.log('AD.comm.socket.subscribe(): registering message['+message+'] with io.socket.on()');


            // BUILD FIX: steal build will die because the io library wont properly compile
            if (typeof io != 'undefined') {
                io.socket.on(message, function (data) {
                    // console.log('io.socket.on(): message['+message+']');
                    processMessage(message, data);
                });
            }

            notified[message] = true;

        }


        // now register this request with a subscriptionID
        subscriptionCount++;
        subscriptionIDs[subscriptionCount] = {
            message: subscriptions[message],         // links to the {} at [message]
            verb: verb,
            cb: cb
        }

        return subscriptionCount;

    },
};

