"use strict";

import $ from 'jquery';
import can from 'can';

/**
 * @class AD.classes.UIController
 * @parent can.Control
 *
 * Identical to can.Control except it automatically scans its contents during
 * initialization and sets up all elements with the 'app-label-key' attribute
 * as Label controls. These labels can then be translated using the 
 * translateLabels() method.
 */
var UIController = can.Control.extend({
    // Static properties

}, {
    // Instance properties

    domToString: function ($el) {

        return $('<div>').append($el.clone()).html();

    },


    /**
     * @function domToTemplate
     *
     * return the contents of the given DOM element as a string template.
     *
     * This routine will perform common template setup routines:
     *
     */
    domToTemplate: function ($el) {

        if ($el.length == 0) {
            console.error('domToTemplate(): no $el found. ');
        }
        // remove anything specifically marked as mockup
        $el.find('.mockup').remove();

        var tmpl = $el.html();
        if (tmpl != '') {

            var expectedTags = [
                { from: '<!--', to: '<%' },
                { from: '-->', to: '%>' },
                { from: '[[=', to: '<%=' },
                { from: '[[-', to: '<%==' },
                { from: ']]', to: '%>' }
            ];
            expectedTags.forEach(function (tag) {
                tmpl = AD.util.string.replaceAll(tmpl, tag.from, tag.to);
            });


            // now embed any specified object references:
            // <%= (el) -> can.data(el, 'person', person) %>
            tmpl = tmpl.replace(/obj-embed="(\w+)"/g, function ($0, $1) {
                return "<%= (el) -> can.data(el, '" + $1 + "', " + $1 + ") %>";
            });

        }

        return tmpl;
    },



    /**
     * @function entryForID
     * scan a given array for an entry that has .id == id.
     * @param {array} list  the list of elements to scan
     * @param {integer} id  the id we are looking for
     * @return {obj} || null 
     */
    entryForID: function (list, id) {

        id = parseInt(id);  // make sure you have an integer here!

        for (var i = list.length - 1; i >= 0; i--) {
            if ((list[i].id) && (list[i].id == id)) {
                return list[i];
            }
        };

        return null;
    },



    /**
     * @function indexForID
     * scan a given array for an entry that has .id == id. and return
     * the index of that entry.
     * @param {array} list  the list of elements to scan
     * @param {integer} id  the id we are looking for
     * @return {int} || -1 if not found 
     */
    indexForID: function (list, id) {

        var entry = this.entryForID(list, id);
        if (entry) {
            return list.indexOf(entry);
        }
        return -1;
    },



    hide: function () {
        this.element.hide();
    },

    show: function () {
        this.element.show();
    },

    init: function ($element) {

    },

    /**
     * @function translateLabels
     * @param string lang (Optional)
     */
    translateLabels: function (lang) {
        $.each(this.labels, function () {
            this.translate(lang);
        });
    }

});


export default UIController;