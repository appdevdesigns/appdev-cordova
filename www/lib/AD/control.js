// Requires the global `AD` object
"use strict";

import can from 'can';

var __controllersReady = {};    // hash of the controllers that have been created
                                // format:  { "controllerName": deferred }

var Control = {

    /**
     * @function extend
     * Create a can.Control object namespaced under AD.controllers.* 
     * 
     * @param [string] name      The name of the controller.  The
     *        name can be namespaced like so: 'application.info.list'.
     *        This will create a: AD.controllers.application.info.list
     *        controller, that you would then attach to the DOM like:
     *        AD.controllers.application.info.list('#infoList', {
     *          options:true
     *        });
     *
     * @param [object] static    [optioinal] The static method 
     *        definitions
     * @param [object] instance  The instance definition
     */
    extend: function (name, staticDef, instanceDef) {

        // first lets figure out our namespacing:
        var nameList = name.split('.');
        var controlName = nameList.pop(); // remove the last one.

        // for each remaining name segments, make sure we have a 
        // namespace container for it:
        var curr = AD.controllers;
        nameList.forEach(function (name) {

            if (typeof curr[name] == 'undefined') {
                curr[name] = {};
            }
            curr = curr[name];
        })

        // now let's create our final control:
        // We subclass the UIController here so our UI controllers have
        // built in translation capabilities.
        curr[controlName] = AD.classes.UIController.extend(staticDef, instanceDef);

        // mark this controller as ready
        AD.Control.ready(name).resolve();
    },


    get: function (name) {
        return findObject(AD.controllers, name);
    },


    "new": function (name, el, options) {
        var Obj = findObject(AD.controllers, name);
        return new Obj(el, options);
    },


    ready: function(name) {
        // create the deferred if it doesn't exist
        if (!__controllersReady[name]) {
            __controllersReady[name] = AD.sal.Deferred();
        }
        return __controllersReady[name];
    }
};


export default Control;


/*
 * @function findObject
 * @private
 *
 * Return the object specified by the given name space:
 *
 * @param {object} baseObj  The base object to search on
 *                          usually AD.models or AD.models_base
 *
 * @param {string} name   The provided namespace to parse and search for
 *                        The name can be spaced using '.' 
 *                        eg.  'coolTool.Resource1' => AD.models.coolTool.Resource1
 *                             'coolerApp.tool1.Resource1' => AD.models.coolerApp.tool1.Resource1
 *
 * @returns {object}  the object resolved by the namespaced base 
 *                    eg:  findObject(AD.models, 'Resource') => return AD.models.Resource
 *                         findObject(AD.models, 'coolTool.Resource1') => AD.models.coolTool.Resource1
 *
 *                    if an object is not found, null is returned.
 */
function findObject(baseObj, name) {

    // first lets figure out our namespacing:
    var nameList = name.split('.');

    // for each remaining name segments, make sure we have a 
    // namespace container for it:
    var curr = baseObj;
    nameList.forEach(function (name) {
        if (!curr) {
            console.error('Why is curr null?', baseObj, name);
        }
        if (typeof curr[name] == 'undefined') {
            curr = null;
        }
        if (curr) curr = curr[name];
    })

    return curr;
}

