"use strict";

import sal from './sal.js';

var pendingRequests = [];

function processRequest(entry) {
    sal.setImmediate(() => {
        entry.request(entry.opts, (err, data) => {
            
            // callback style
            if (entry.cb) {
                entry.cb(err, data);
            }
            
            // deferred style
            if (entry.dfd) {
                if (err) {
                    entry.dfd.reject(err);
                } else {
                    entry.dfd.resolve(data);
                }
            }
            
        });
    });
}

export default {
    add(context) {
        pendingRequests.push(context);
    },
    
    process() {
        var currReq;
        while (currReq = pendingRequests.shift()) {
            processRequest(currReq);
        }
    }
};