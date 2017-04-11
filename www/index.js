/**
 * This is the entry point. It is the master controller over all the pages and
 * the navbar.
 */
"use strict";

import 'lib/AD.js';
import server from 'lib/app/server.js';

import loadingPage from 'lib/app/controllers/loadingPage.js';
import loginPage from 'lib/app/controllers/loginPage.js';
import serverPage from 'lib/app/controllers/serverPage.js';
import appPage from 'lib/app/controllers/appPage.js';

import navbar from 'lib/app/controllers/navbar.js';

var pages = {
    'loading': loadingPage,
    'server': serverPage,
    'login': loginPage,
    'app': appPage,
};



//// Server connect
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
    navbar.hideLinks();
    pages.server.show();
});
server.on('connecting', () => {
    pages.loading.overlay();
});


//// Server login
// When the submit button is clicked on the login page
server.on('loginStart', () => {
    pages.loading.overlay();
});
server.on('loginDone', () => {
    pages.loading.hide();
    navbar.showLinks();
    pages.app.show();
});
server.on('loginFailed', () => {
    pages.loading.hide();
});
// This gets triggered when a request is made without a valid session
// (including after session timeout)
AD.ui.reauth.on('start', () => {
    navbar.hideLinks();
    pages.login.show();
});


//// Server logout
server.on('logoutStart', () => {
    pages.loading.overlay();
});
server.on('logoutFailed', (err) => {
    console.log(err);
    pages.loading.hide();
});
// After logging out, clear all page data
server.on('logoutDone', () => {
    pages.login.show();
    pages.app.clearData();
});



//// Navbar
// Show all navbar links with the main app page
pages.app.on('show', () => {
    navbar.showLinks();
});
navbar.on('click.profile', () => {

});
navbar.on('click.logout', () => {
    server.logout();
});
navbar.on('click.server', () => {
    pages.server.show();
});
/*
navbar.on('click.app', () => {
    pages.app.show();
});
navbar.on('click.page', () => {
    pages.app.show();
});
*/


pages.app.on('loadingStart', () => {
    pages.loading.overlay();
});
pages.app.on('loadingDone', () => {
    pages.loading.hide();
});


//// Begin app
if (typeof cordova != 'undefined') {
    document.addEventListener('deviceready', () => {
        server.connect();
    }, false);
} else {
    server.connect();
}