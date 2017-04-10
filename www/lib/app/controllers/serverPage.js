/**
 * @class ServerPage
 * 
 * This page allows the user to enter the URL of the server they wish to
 * connect to. Once the URL is set and verified, the value will persist through
 * app restarts. The page should only appear again if the server cannot be
 * contacted.
 *
 * Exports a singleton instance of the ServerPage class.
 */
"use strict";

//import $ from 'jquery';
//import async from 'async';
//import _ from 'lodash';

import Page from 'lib/app/page.js';
import server from 'lib/app/server.js';

const pageID = 'server-config';

class ServerPage extends Page {
    constructor() {
        super(pageID, 'lib/app/templates/server.html');
    }
    
    init() {
        this.$textbox = this.$element.find('input');
        this.$textbox.val(server.get());
        this.$textbox.on('change', () => {
            server.set(this.$textbox.val());
        });
        this.$textbox.on('keypress', (event) => {
            // Pressing 'Enter' in the textbox
            if (event.which == 13) {
                this.$textbox.blur();
                this.$ok.trigger('click');
            }
        });
        
        this.$alert = this.$element.find('.alert');
        this.$alert.find('button').on('click', () => {
            this.$alert.hide();
        });
        
        this.$ok = this.$element.find('button#server-connect');
        this.$ok.on('click', () => {
            this.$alert.hide();
            server.connect()
            .fail(() => {
                this.$alert.show();
            });
        });
    }
}

var serverPage = new ServerPage();
export default serverPage;
