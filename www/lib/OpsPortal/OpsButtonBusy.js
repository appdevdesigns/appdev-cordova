"use strict";
import 'lib/AD.js';

// The OpsPortal will define a global namespace for our added utilities:
if (typeof AD.op == 'undefined') AD.op = {};

/**
 * @class AD.op.ButtonBusy
 * @parent can.Control
 *
 * This is a button controller that lets us show busy spinners on a button
 * while it's operation is in process.
 *
 * The button element needs to contain an element to attach the spinner 
 * icon to.  
 *
 * For example, for a button defined this way:
 * @codestart
 *      <button class="btn op-btn btn-primary my-button" ><i class="fa"></i>Add</button>
 * @codeend
 *
 * You can control it like this:
 * @codestart
 *      this.button = new AD.op.ButtonBusy(this.element.find('.my-button'));
 *      this.button.busy();  // starts the spinner and disables the button
 *      this.button.ready(); // hides the spinner and enables the button.
 * @codeend
 * 
 * @param {json} options
 *              .selectorIcon   : {string} the jquery selector for the spinner icon
 *              .classBusy      : {string} the class to add for the busy spinner (default: fa-spinner)
 *              .shouldDisable  : {bool} disable the button when .busy() ?
 *              .onClick        : {fn} a callback fn to call when the button is clicked.
 */
AD.op.ButtonBusy = can.Control.extend({
    // Static Properties
},{

    // Instance Properties:

    init: function (element, options) {
        var _this = this;
        options = AD.defaults({
            // templateDOM: '//OpsPortal/views/OpsButtonBusy/OpsButtonBusy.ejs'
            selectorIcon: '.fa',        // jquery selector for the icon el
            classBusy: 'fa-spinner',    // the class to add for the spinner
            shouldDisable: true,        // auto disable on busy() ?
            onClick: function (ev) { }    // button.click() handler
        }, options);
        this.options = options;

        // Call parent init
        this._super(element, options);

        this.dom = {};
        this.dom.icon = null;       // the icon $element

        this.busyClass = this.options.classBusy + ' fa-pulse';  // class for spinner


        this.initDOM();
    },


    busy: function (shouldDisable) {

        this.dom.icon.addClass(this.busyClass);
        if ((shouldDisable)
            || (this.options.shouldDisable)) {
            this.disable();
        }
    },


    disable: function () {
        if (this.element) {
            this.element.attr('disabled', 'disabled');
            this.element.addClass('disabled');
        }
    },


    enable: function () {
        if(this.element) {
            this.element.removeAttr('disabled');
            this.element.removeClass('disabled');
        }
    },


    initDOM: function () {
        var _this = this;


        // this.element.html(can.view(this.options.templateDOM, {} ));
        this.dom.icon = this.element.find(this.options.selectorIcon);
        if (this.dom.icon.length == 0) {
            console.warn('**** Opsportal.ButtonBusy did not find icon using selector[' + this.options.selectorIcon + ']');
        } else {
            this.dom.icon.click(function (ev) {
                _this.options.onClick(ev);
            })
        }

    },


    ready: function () {
        this.dom.icon.removeClass(this.busyClass);
        this.enable();
    }


});
