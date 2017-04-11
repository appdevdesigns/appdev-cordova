/**
 * @class Server
 * 
 * Manages the connection to the server, including authentication.
 *
 * Exports a singleton instance of the Server class.
 */
"use strict";

//import $ from 'jquery';
import async from 'async';
import EventEmitter from 'eventemitter2';
import 'lib/AD.js';

var socketInitialized = false;

class Server extends EventEmitter {
    
    constructor() {
        super();
        this.userInfo = {};
        this.makeSessionTrigger();
    }
    
    get() {
        return localStorage.getItem('baseURL');
    }
    
    set(value) {
        localStorage.setItem('baseURL', value);
    }
    
    
    /**
     * Create a new internal Deferred that resolves when the server session is
     * ready.
     *
     * A session becomes ready when either:
     *      - login is first completed 
     *      - login is completed after previously logging out
     *      - checkSession() succeeds the first time
     *        (meaning, the app started up and found the previous session valid)
     *
     * It does not become ready when:
     *      - relogin after session had timed out
     *        (meaning, logout() was not called)
     *
     */
    makeSessionTrigger() {
        this.readyDFD = $.Deferred();
        this.readyDFD.done(() => {
            this.emit('sessionReady');
        });
    }
    
    
    /**
     * Make initial connection with the Sails server to get basic
     * info like its authentication type and site base URL.
     *
     * Events: 'connecting', 'connected', 'connectFailed'
     * 
     * @return {Deferred}
     */
    connect() {
        this.emit('connecting');
        
        var dfd = AD.sal.Deferred();
        dfd.done(() => {
            this.emit('connected');
        });
        dfd.fail(() => {
            this.emit('connectFailed');
        });
        
        var url = this.get();
        if (!url) {
            dfd.reject();
        }
        else {
            url += '/appdev/config/data.json';
            AD.comm.service.get({ url })
            .fail((err) => {
                console.log('Server connect failed', err);
                dfd.reject(err);
            })
            .done((data) => {
                if (typeof data == 'object') {
                    for (var key in data) {
                        AD.config.setValue(key, data[key]);
                    }
                    
                    if (data.siteBaseURL) {
                        /*
                        //// Steal.js
                        System.baseURL = data.siteBaseURL;
                        
                        //// CanJS ajax
                        can.ajax = (a, b) => {
                            // Insert the base URL before the ajax URL param
                            if (typeof a == 'string' && a[0] == '/') {
                                a = data.siteBaseURL + a;
                            }
                            else if (typeof a == 'object' && a.url && a.url[0] == '/') {
                                a.url = data.siteBaseURL + a.url;
                            }
                        };
                        */
                        
                        //// socket.io
                        this.initSocket(data.siteBaseURL);
                    }
                }
                
                dfd.resolve();
            });
        }
        
        return dfd;
    }
    
    
    /**
     * Used by connect() to load and configure the socket.io library
     */
    initSocket(baseURL) {
        if (!socketInitialized) {
            $.getScript('lib/sails.io.js')
            .done(() => {
                // Set the base URL immediately after sails.io.js loads.
                // It will wait one tick before initializing its URL.
                io.sails.url = baseURL;
                socketInitialized = true;
                
                io.socket.on('connect', (msg) => {
                    this.emit('socketConnected');
                    
                    AD.comm.socket.get({ url: '/opsportal/socket/register' })
                        .fail(console.error)
                        .done(() => {
                            console.log('OpsPortal socket registered');
                        });
                });
            })
            .fail(console.log);
        }
    }
    
    
    /**
     * Check if we are currently in an authenticated session with the Sails
     * server.
     *
     * @return {Deferred}
     */
    checkSession() {
        var dfd = $.Deferred();
        var url = AD.config.getValue('siteBaseURL') + '/begin';
        
        AD.sal.http({ url })
        .fail((err) => {
            dfd.reject();
        })
        .done(() => {
            this.fetchUserInfo()
            .always(() => {
                this.readyDFD.resolve();
                dfd.resolve();
            });
        });
        
        return dfd;
    }
    
    
    /**
     * Get the current user's profile information from the server.
     * Results are stored in `this.userInfo`
     *
     * @return {Deferred}
     *      Resolves with a basic object containing the user information
     */
    fetchUserInfo() {
        return AD.comm.service.get({ url: '/site/user/data' })
            .done((data) => {
                this.userInfo = data;
            })
            .fail((err) => {
                console.log('fetchUserInfo() failed', err);
            });
    }
    
    
    /**
     * Get the list of permission actions that the user is allowed to perform
     *
     * @return {Array}
     */
    getUserActions() {
        return this.userInfo.actions || [];
    }
    
    
    /**
     * Log the user out of the Sails server.
     *
     * @return {Deferred}
     */
    logout() {
        this.emit('logoutStart');
        
        var authType = AD.config.getValue('authType') || '';
        if (authType.toLowerCase() == 'cas') {
            // For CAS auth, we log out of the CAS server in addition to the
            // site server.
            this.logoutCAS();
        }
        
        return AD.sal.http({ url: '/site/logout' })
            .done(() => {
                this.emit('logoutDone');
                this.makeSessionTrigger();
            })
            .fail((err) => {
                this.emit('logoutFailed', err);
                console.log(err);
            });
    }
    
    
    /**
     * Terminate the TGT with the CAS server
     * 
     * @return {Deferred}
     */
    logoutCAS() {
        var casURL = AD.config.getValue('casURL');
        
        return $.ajax({
            url: casURL + '/cas/v1/tickets/' + this.casTGT,
            method: 'DELETE',
        });
    }
    
    
    /**
     * Login the user to the Sails server.
     *
     * Events: 'loginStart', 'loginDone', 'loginFailed'
     *
     * @param {string} username
     * @param {string} password
     * @return {Deferred}
     */
    login(username, password) {
        var authType = AD.config.getValue('authType') || '';
        var dfd;
        
        this.emit('loginStart');
        
        if (authType.toLowerCase() == 'cas') {
            dfd = this.loginCAS(username, password);
        }
        else {
            dfd = this.loginLocal(username, password);
        }
        
        dfd.done(() => {
            // Tell AD framework it can resume server requests
            AD.ui.reauth.end();
            
            this.fetchUserInfo()
            .fail(console.log) // not fatal if this fails
            .always(() => {
                this.readyDFD.resolve();
                this.emit('loginDone');
            });
        });
        dfd.fail(() => {
            this.emit('loginFailed');
        });
        
        return dfd;
    }
    
    
    /**
     * Used by login(). If called directly, will not emit events.
     * Local auth.
     */
    loginLocal(username, password) {
        return AD.comm.service.post({
            url: '/site/login',
            data: {
                username,
                password,
            }
        });
    }
    
    
    /**
     * Used by login(). If called directly, will not emit events.
     * RESTful CAS interface.
     */
    loginCAS(username, password) {
        var dfd = $.Deferred();
        var siteURL = AD.config.getValue('siteBaseURL');
        var casURL = AD.config.getValue('casURL');
        //casURL = siteURL;
        
        this.casTGT = '';
        var tgtURL;
        var ticket;
        var serviceURL = siteURL + '/site/begin';
        var csrf = null;
        
        async.series([
            /*
            (next) => {
                $.ajax({ url: siteURL+'/csrfToken' })
                .fail(next)
                .done((data) => {
                    csrf = data._csrf;
                    next();
                });
            },
            */
            
            // Get the TGT
            (next) => {
                $.ajax({
                    url: casURL+'/cas/v1/tickets',
                    method: 'POST',
                    data: {
                        username,
                        password,
                        _csrf: csrf,
                    }
                })
                .fail(next)
                .done((data, textStatus, xhr) => {
                    tgtURL = xhr.getResponseHeader('Location');
                    // The actual TGT is at the end of the URL. Save for logout.
                    this.casTGT = (tgtURL.match(/[^\/]+$/) || [])[0];
                    if (!tgtURL) {
                        return next(new Error('Invalid TGT from CAS server'));
                    }
                    next();
                });
            },
            
            // Use TGT to get login ticket
            (next) => {
                $.ajax({
                    url: tgtURL,
                    method: 'POST',
                    data: {
                        service: serviceURL,
                        _csrf: csrf,
                    }
                })
                .fail(next)
                .done((data) => {
                    ticket = data;
                    next();
                });
            },
            
            // Use ticket to login and establish session
            (next) => {
                serviceURL += '?ticket='+ticket;
                AD.sal.http({ url: serviceURL })
                .fail((err) => {
                    next(err);
                })
                .done(() => {
                    next();
                });
            }
            
        ], (err) => {
            if (err) dfd.reject(err);
            else dfd.resolve();
        });
        
        return dfd;
    }
    
};

var server = new Server();
export default server;

