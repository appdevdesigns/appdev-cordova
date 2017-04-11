/**
 * @class Page
 * 
 * Base class for page controllers in the mobile framework.
 * Is an EventEmitter.
 *
 * Emits `show` event when `show()` method is called.
 * Emits `hide` event when `hide()` method is called.
 */
"use strict";

//import $ from 'jquery';
//import async from 'async';
import EventEmitter from 'eventemitter2';

export default class Page extends EventEmitter {
    /**
     * @param {string} pageID
     *      The DOM element ID of the page div
     * @param {string} [template]
     *      Optional path to the template file.
     *      Default is no template.
     * @param {string} [css]
     *      Optional path to the CSS file.
     *      Default is no CSS.
     */
    constructor(pageID, template, css) {
        super({
            wildcard: true
        });
        
        this.template = template;
        this.css = css;
        this.pageID = pageID;
        this.$element = $('#'+pageID);
        
        this.render()
        .done(() => {
            this.init();
        });
    }
    
    
    /**
     * Inserts HTML and CSS into the document
     */
    render() {
        if (this.$element.length == 0) {
            // Create the page div if it does not exist
            this.$element = $(`<div id="${this.pageID}" class="page">`);
            $('body').append(this.$element);
        } 
        else if (!this.$element.hasClass('page')) {
            this.$element.addClass('page');
        }
        
        this.addCSS(this.css);
        
        return this.addHTML(this.template)
    }
    
    
    /**
     * Load a CSS file into the document
     */
    addCSS(cssFilePath) {
        if (cssFilePath) {
            $('<link>')
                .appendTo('head')
                .attr({
                    type: 'text/css',
                    rel: 'stylesheet',
                    href: cssFilePath
                });
        }
    }
    
    
    /**
     * Add HTML from a template into the page element
     * @param {string} templateFilePath
     * @return {Deferred}
     */
    addHTML(templateFilePath) {
        var dfd = $.Deferred();
        
        if (!templateFilePath) dfd.resolve();
        else {
            $.get(templateFilePath)
            .fail((err) => {
                console.log(err);
                dfd.reject(err);
            })
            .done((html) => {
                this.$element.html(html);
                dfd.resolve();
            });
        }
        
        return dfd;
    }
    
    
    /**
     * Subclasses should override this to set up event handling of
     * their page's DOM elements.
     */
    init() {
    }
    
    
    /**
     * Hide this page
     */
    hide() {
        this.$element.hide();
        this.emit('hide');
    }
    
    
    /**
     * Show this page and hide all the others.
     */
    show() {
        $('body > div.page').hide();
        this.$element.show();
        this.emit('show');
    }
}
