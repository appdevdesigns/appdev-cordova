/**
 * @object AD
 * 
 * This is the client side `AD` object from the AppDev OpsPortal web version.
 * It is loaded into the global scope.
 *
 */
"use strict";

import $ from 'jquery';
import async from 'async';
//import _ from 'lodash';
//import can from 'can';

import sal from 'lib/AD/sal.js';
import config from 'lib/AD/config.js';
import hub from 'lib/AD/hub.js';
import reauth from 'lib/AD/reauth.js';
import pending from 'lib/AD/pending.js';
import errorHandling from 'lib/AD/errorHandling.js';
import errorLog from 'lib/AD/errorLog.js';
import string from 'lib/AD/string.js';
import uuid from 'lib/AD/uuid.js';
import lang from 'lib/AD/lang.js';

import { csrf, isServerReady, service } from 'lib/AD/service.js';
import socket from 'lib/AD/socket.js';

import UIController from 'lib/AD/UIController.js';
import Control from 'lib/AD/control.js';
import labelController from 'lib/AD/label.js';
import Model from 'lib/AD/model.js';

var AD = {
    sal,
    util: {
        async,
        string,
        uuid,
    },
    
    config,
    
    classes: {
        UIController,
    },
    controllers: {
        label: labelController,
    },
    Control,
    
    models: {},
    models_base: {},
    Model,
    
    widgets: {},
    ui: {
        jQuery: $,
        reauth,
    },
    comm: {
        hub,
        pending,
        error: errorHandling,
        csrf,
        isServerReady,
        service,
        socket,
    },
    error: {
        log: errorLog
    },
    
    lang
};
window.AD = AD;
