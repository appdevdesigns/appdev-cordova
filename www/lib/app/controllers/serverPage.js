/**
 * @class ServerPage
 * 
 * This page allows the user to enter the URL of the server they wish to
 * connect to. Once the URL is set and verified, the value will persist through
 * app restarts. The page will appear again if the server cannot be
 * contacted.
 *
 * Exports a singleton instance.
 */
"use strict";

//import $ from 'jquery';
import Page from 'lib/app/page.js';
import server from 'lib/app/server.js';

class ServerPage extends Page {
    constructor() {
        super('server-config', 'lib/app/templates/server.html');
    }
    
    init() {
        this.$alert = this.$element.find('.alert');
        this.$textbox = this.$element.find('input');
        this.$ok = this.$element.find('button#server-connect');
        
        this.$textbox.val(server.get());
        this.$textbox.on('change', () => {
            var url = this.$textbox.val();
            if (url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/)) {
                server.set(url);
                this.message();
                this.$ok.prop('disabled', false);
            }
            else {
                this.message('parse-error');
                this.$ok.prop('disabled', true);
            }
        });
        this.$textbox.on('keypress', (event) => {
            // Pressing 'Enter' in the textbox
            if (event.which == 13) {
                this.$textbox.blur();
                this.$ok.trigger('click');
            }
        });
        
        // Dismiss alert message
        this.$alert.find('button').on('click', () => {
            this.message();
        });
        
        this.$ok.on('click', () => {
            this.message();
            server.connect()
            .fail(() => {
                this.message('connection-error');
            });
        });
    }
    
    
    /**
     * Set or hide the alert message.
     * @param {string} [type]
     *      Either "connection-error" or "parse-error".
     *      Default is to hide all messages.
     */
    message(type=null) {
        if (type == null) {
            this.$alert.hide();
        }
        else {
            this.$alert.find('.message').hide()
            this.$alert.find('.'+type).show();
            this.$alert.show();
        }
    }
}

var serverPage = new ServerPage();
export default serverPage;
