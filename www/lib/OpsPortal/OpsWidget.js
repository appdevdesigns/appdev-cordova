"use strict";
import 'lib/AD.js';

// The OpsPortal will define a global namespace for our added utilities:
if (typeof AD.op == 'undefined') AD.op = {};

/**
 * @class AD.op.Widget
 * @parent can.Control
 *
 * This is a generic Ops Widget controller that will handle resizing a section of
 * HTML that conforms to the standard op-widget specification.
 *
 * An op-widget looks like:
 *     <div class="op-container op-widget" id="....t">
 *         <div class="op-widget-masthead">
 *         </div>
 *     
 *         <div class="op-widget-body">
 *         </div>
 *     
 *         <div class="op-widget-footer">
 *         </div>
 *     </div>
 *
 * .op-widget-masthead: (optional) defines a header for the widget
 * .op-widget-footer:  (optional) defines content for a footer of the widget
 * .op-widget-body:  defines the content of the widget.
 *
 * This class is intended to be attached to the outer .op-widget definition, and it will
 * manage the heights of the inner sections.
 *
 *
 */
AD.op.Widget = can.Control.extend({
    // Static Properties
}, {

        // Instance Properties:

        init: function (element, options) {
            var _this = this;
            options = AD.defaults({
                // // templateDOM: '//OpsPortal/views/OpsButtonBusy/OpsButtonBusy.ejs'
                // selectorIcon: '.fa',        // jquery selector for the icon el
                // classBusy: 'fa-spinner',    // the class to add for the spinner
                // shouldDisable: true,        // auto disable on busy() ?
                // onClick:function(ev) { }    // button.click() handler
            }, options);
            this.options = options;

            // Call parent init
            this._super(element, options);


            this.initDOM();
        },




        initDOM: function () {


        },



        resize: function (data) {

            if (data) {
                
                // the outer height of my .op-widget should be: data.height
                this.element.css("height", data.height + "px");
        
        
                // the height of our body section  should be the height of our widget - mastHead - footer
     
                var footerHeight = this.element.find(".op-widget-footer").outerHeight(true);

                var mastheadHeight = this.element.find(".op-widget-masthead").outerHeight(true);

                this.element.find('.op-widget-body').css("height", (data.height - mastheadHeight - footerHeight) + "px");
            }
        }



        // '.ad-item-add click': function ($el, ev) {

        //     ev.preventDefault();
        // }


    });

