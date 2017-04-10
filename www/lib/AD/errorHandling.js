"use strict";

import 'lib/AD.js';

export default function error(data, context) {
    if (data) {
        var errorID = data.id;
        // Authentication failure (session timeout)
        if (errorID == 5) {
            // Store the failed request
            AD.comm.pending.add(context);
            
            // Reauthenticate
            AD.ui.reauth.start()
            .done(() => {
                // Retry the failed request
                AD.comm.pending.process();
            });
            
            return;
        }
    }
    
    // Not authentication failure
    AD.comm.hub.publish('ad.err.notification', data);
    if (context.cb) {
        context.cb(data);
    }
    context.dfd.reject(data);
    
}
