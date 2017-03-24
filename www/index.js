/**
 * This is the entry point. It is the master controller over all the pages.
 */
"use strict";

import 'lib/AD.js';
import server from 'lib/app/server.js';

import loadingPage from 'lib/app/controllers/loadingPage.js';
import loginPage from 'lib/app/controllers/loginPage.js';
import serverPage from 'lib/app/controllers/serverPage.js';
import appPage from 'lib/app/controllers/appPage.js';

var pages = {
    'loading': loadingPage,
    'server': serverPage,
    'login': loginPage,
    'app': appPage,
};


// This gets triggered when a request is made without a valid session
// (including after session timeout)
AD.ui.reauth.on('start', () => {
    pages.login.show();
});

// After initial contact is made with the server
server.on('connected', () => {
    server.checkSession()
    .fail(() => {
        pages.login.show();
    })
    .done(() => {
        pages.app.show();
    });
});
server.on('connectFailed', () => {
    pages.server.show();
});
server.on('connecting', () => {
    pages.loading.overlay();
});

// When the submit button is clicked on the login page
server.on('loginStart', () => {
    pages.loading.overlay();
});
server.on('loginDone', () => {
    pages.loading.hide();
    AD.ui.reauth.end();
    pages.app.show();
});
server.on('loginFailed', () => {
    pages.loading.hide();
});


// Begin app
document.addEventListener('deviceready', () => {
    server.connect();
}, false);
