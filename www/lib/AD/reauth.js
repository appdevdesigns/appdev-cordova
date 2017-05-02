/**
 * AD.ui.reauth
 *
 * This is called from AD.comm.error when it receives an authentication failure
 * response from the server. Unlike the web version, this will not directly
 * interface with a re-login widget. Rather, it emits events to allow the
 * master controller to act.
 *
 * Exports a singleton instance.
 */
"use strict";

import sal from './sal.js';
import EventEmitter from 'eventemitter2';

var isReauthenticating;
var dfd;
var widget;

class Reauth extends EventEmitter {
    constructor() {
        super();
        isReauthenticating = false;
        // widget = 
        dfd = null;
    }
    
    inProgress() {
        return isReauthenticating;
    }
    
    start() {
        if (!isReauthenticating) {
            isReauthenticating = true;
            // widget.show();
            this.emit('start')
            dfd = sal.Deferred();
        }
        return dfd;
    }
    
    end() {
        isReauthenticating = false;
        // widget.hide()
        this.emit('end');
        dfd && dfd.resolve();
    }
}

var reauth = new Reauth();
export default reauth;
