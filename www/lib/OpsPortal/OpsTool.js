"use strict";
import 'lib/AD.js';

// Namespacing conventions:
// AD.classes.[application].[Class]  --> Object
if (typeof AD.classes.opsportal == 'undefined') AD.classes.opsportal = {};
AD.classes.opsportal.OpsTool = can.Control.extend({

    init: function (element, options) {
        var self = this;
        this.options = AD.defaults({
            resize_notification: 'opstool.resize'
        }, options);

        this.shouldUpdateUI = true;     // we have not updated our UI for the work area yet.

        this.labels = [];       // the list of multilingual labels inside our Tool
    },



    needsUpdate: function () {
        // called by containing ops portal Tool() object when a new
        // has been issued.
        this.shouldUpdateUI = true;
    },



    resize: function (data) {
        // called by containing ops portal Tool() object when a tool is
        // shown to the user.

        // more importantly it keeps a tool from resizing when it isn't
        // shown, which can introduce css mistakes from false height()
        // values.

        if (this.shouldUpdateUI) {
            AD.comm.hub.publish(this.options.resize_notification, data);
            this.shouldUpdateUI = false;
        }

    },



    translate: function () {
        // initiate the Multilingual Label translation for the interface labels
        // created by this tool.
        this.labels = AD.lang.label.translate(this.element);
    }


});



// Create an AD.Control.OpsTool.extend()  function:
if (typeof AD.Control.OpsTool == 'undefined') {

    AD.Control.OpsTool = {
        /**
         * @function extend
         *
         * Create a AD.classes.opsportal.OpsTool object namespaced under 
         * AD.controllers.opstools.* 
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


            // Namespacing conventions:
            // AD.controllers.opstools.[Tool].Tool  --> main controller for tool
            // AD.controllers.opstools.[Tool].[controller] --> sub controllers for tool


            // make sure our base opstools exists.
            if (typeof AD.controllers.opstools == 'undefined') AD.controllers.opstools = {};
    

            // // first lets figure out our namespacing:
            // // Question: do we actually allow namespacing? 'HrisUserProfile.subTool.subsubTool'
            // var nameList = name.split('.');

            // // for each remaining name segments, make sure we have a 
            // // namespace container for it:
            // var curr = AD.controllers.opstools;
            // nameList.forEach(function (name) {

            //     if (typeof curr[name] == 'undefined') {
            //         curr[name] = {};
            //     }
            //     curr = curr[name];
            // })
            var curr = _parseName(name);

            // now let's create our final control:
            // We subclass the UIController here so our UI controllers have
            // built in translation capabilities.
            curr.Tool = AD.classes.opsportal.OpsTool.extend(staticDef, instanceDef);
            can.extend(curr.Tool.prototype, can.event); // they are event emitters

        },


        get: function(name) {

            var curr = _parseName(name);
            return curr.Tool;
        }
    }


    function _parseName(name) {

        // first lets figure out our namespacing:
        // Question: do we actually allow namespacing? 'HrisUserProfile.subTool.subsubTool'
        var nameList = name.split('.');

        // for each remaining name segments, make sure we have a 
        // namespace container for it:
        var curr = AD.controllers.opstools;
        nameList.forEach(function (name) {

            if (typeof curr[name] == 'undefined') {
                curr[name] = {};
            }
            curr = curr[name];
        })

        return curr;
    }

}

