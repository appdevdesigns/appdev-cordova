/**
 * @class LoginPage
 * 
 * This page allows the user to enter their username and password to
 * authenticate with the server. It may be invoked as needed if the
 * session times out.
 *
 * Exports a singleton instance of the LoginPage class.
 */
 "use strict";

//import $ from 'jquery';
//import async from 'async';
//import _ from 'lodash';
import Page from 'lib/app/page.js';
import server from 'lib/app/server.js';
const pageID = 'login-page';

class LoginPage extends Page {
    constructor() {
        super(pageID, 'lib/app/templates/login.html', 'css/login.css');
    }
    
    init() {
        this.$username = this.$element.find('#user-name');
        this.$password = this.$element.find('#user-pw');
        this.$form = this.$element.find('form');
        this.$alert = this.$element.find('.alert');
        
        this.on('show', () => {
            // Focus the username textbox by default
            this.$username.focus();
            this.$alert.hide();
        });
        
        this.$form.on('submit', (ev) => {
            ev.preventDefault();
            this.$alert.hide();
            server.login(this.$username.val(), this.$password.val())
            .always(() => {
                this.$password.val('');
            })
            .done(() => {
                this.hide();
            })
            .fail((err) => {
                this.$alert.find('.message').text(err.message);
                this.$alert.show();
            });
        });
        
        this.$alert.find('button').on('click', () => {
            this.$alert.hide();
        });
    }
}

var loginPage = new LoginPage();
export default loginPage;