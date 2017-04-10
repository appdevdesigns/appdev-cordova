/**
 * @class AppPage
 * 
 * This is the container page for the contained OpsPortal application(s).
 * There can be multiple applications within, and each one has its own 
 * set of pages.
 *
 * Exports a singleton instance.
 */
"use strict";

//import $ from 'jquery';
import async from 'async';
import Page from 'lib/app/page.js';
import server from 'lib/app/server.js';
import navbar from './navbar.js';
import LiveTool from 'lib/AppBuilder/ABLiveTool.js';

import 'payload/models/AB_blah_colors.js';
import ABApplication from 'lib/AppBuilder/models/ABApplication.js';
import ABPage from 'lib/AppBuilder/models/ABPage.js';
import ABObject from 'lib/AppBuilder/models/ABObject.js';

class AppPage extends Page {

    constructor() {
        //super('opstool-app', 'lib/app/templates/app.html');
        super('opstool-app');
        
        this.isActive = false;
        this.rootAppID = null;
        this.apps = {
        /*
            <appID>: {
                'app': <ABApplication>,
                'pages': [ <ABPage>, <ABPage>, ... ],
                'liveTool': <ABLiveTool>,
                '$element': <jQuery>
            },
            <appID2>: { ... },
            <appID3>: { ... },
            ...
        */
        };
        this.pages = {
        /*
            <pageID>: {
                'page': <ABPage>,
                'appLink': <reference to this.apps[appID]>
            },
            ...
        */
        };
    }
    
    
    init() {
        /***
        
        Design question: better for this page to interact directly with
        the navbar? Or let the master controller do it?
        
        ***/
        navbar.on('click.app', (appID, oldAppID) => {
            this.show();
            this.showApp(appID);
        });
        navbar.on('click.page', (pageID, oldPageID) => {
            this.show();
            this.showPage(pageID);
        });
        
        server.once('sessionReady', () => {
            this.loadData();
        });
    }
    
    
    /**
     * Loads apps and pages from the server and instantiates them on
     * the page.
     *
     * @return {Deferred}
     */
    loadData() {
        var dfd = $.Deferred();
        this.rootAppID = null;
        this.clearData();
        
        this.emit('loadingStart');
        
        async.series([
            (next) => {
                ABApplication.findAll()
                .fail(next)
                .done((list) => {
                    if (list && list[0]) {
                        list.forEach((app) => {
                            if (app.pages && app.pages.length > 0) {
                                // First app with pages is the root app
                                this.rootAppID = this.rootAppID || app.id;
                                
                                app.translate && app.translate();
                                
                                // Build the apps reference object
                                this.apps[app.id] = {
                                    'app': app,
                                    'pages': app.pages,
                                };
                                
                                // Build the pages reference object
                                app.pages.forEach((page) => {
                                    this.pages[page.id] = {
                                        'page': page,
                                        'appLink': this.apps[app.id],
                                    };
                                });
                            }
                        });
                    }
                    if (Object.keys(this.apps).length > 0)
                        next();
                    else
                        next(new Error('No apps found'));
                });
            },
            
            (next) => {
                // Re-fetch the ABPage data. Needed because the initial fetch
                // does not contain all of the associations.
                
                var pageIDs = [];
                for (var pageID in this.pages) {
                    pageIDs.push({ id: pageID });
                }
                
                ABPage.findAll({ or: pageIDs })
                .fail(next)
                .done((list) => {
                    if (!list || !list[0]) next(new Error('no pages found'));
                    else {
                        list.forEach((populatedPage) => {
                            populatedPage.translate && populatedPage.translate();
                            // Replace the old shallow ABPage with the new deep
                            // one.
                            this.pages[populatedPage.id]['page'] = populatedPage;
                        });
                        
                        // Replace in the app list also
                        for (var appID in this.apps) {
                            var appInfo = this.apps[appID];
                            for (var i=0; i<appInfo.pages.length; i++) {
                                var pageID = appInfo.pages[i].id;
                                appInfo.pages[i] = this.pages[pageID]['page'];
                            }
                        }
                        
                        next();
                    }
                });                
            },
            
            /*
            (next) => {
                var appIDs = [];
                for (var appID in this.apps) {
                    appIDs.push({ application: appID });
                }
                
                ABObject.findAll({ or: appIDs })
                .fail(next)
                .done((list) => {
                    next();
                });
            },
            */
            
            (next) => {
                // get permissions
                
                next();
            },
            
            (next) => {
                this.setPageLinks(this.rootAppID);
                next();
            },
            
            (next) => {
                // Instantiate ABLiveTools
                for (var appID in this.apps) {
                    var appInfo = this.apps[appID];
                    appInfo.$element = $('<div>')
                        .hide()
                        .appendTo(this.$element);
                    
                    // Find root page
                    var rootPageID = appInfo.pages[0].id;
                    appInfo.pages.forEach((page) => {
                        if (!page.parent) {
                            rootPageID = page.id;
                        }
                    });
                    
                    appInfo.liveTool = new LiveTool(appInfo.$element, {
                        app: appID,
                        page: rootPageID,
                    });
                }
                
                this.apps[this.rootAppID].$element.show();
                next();
            }
        
        ], (err) => {
            this.emit('loadingDone');
            if (err) {
                this.$element.html(`
                    <div class="alert alert-warning" role="alert">
                        No data found on the server
                    </div>
                `);
                dfd.reject(err);
            }
            else {
                this.isActive = true;
                navbar.showLinks();
                dfd.resolve(this.rootAppID);
            }
        });
        
        return dfd;
    }
    
    
    clearData() {
        this.apps = {};
        this.pages = {};
        this.$element.empty();
        navbar.setApps();
        navbar.setPages();
        navbar.hideLinks();
        this.isActive = false;
    }
    
    
    setPageLinks(pageID) {
        // Populate navbar app links
        var appList = {};
        for (var appID in this.apps) {
            //appList[appID] = this.apps[appID].app.translations[0].label;
            var app = this.apps[appID].app;
            appList[appID] = app.label || app.name;
        }
        navbar.setApps(appList);
        
        // Populate navbar page links for the root app
        var pageList = {};
        this.apps[pageID].pages.forEach((page) => {
            if (!page.parent) {
                console.log('adding page: ', page);
                //pageList[page.id] = this.pages[page.id]['page'].translations[0].label;
                pageList[page.id] = this.pages[page.id]['page'].label || page.name;
            }
        });
        navbar.setPages(pageList);
    }
    
    
    /**
     * Show a loaded ABLiveTool app on the page
     */
    showApp(appID) {
        if (this.apps[appID]) {
            this.$element.children().hide();
            this.apps[appID].$element.show();
            
            this.setPageLinks(appID);
            
            this.apps[appID].liveTool.showPage();
        }
    }
    
    
    /**
     * Show a loaded ABLiveTool app's page on the page
     */
    showPage(pageID) {
        if (this.pages[pageID]) {
            var appInfo = this.pages[pageID].appLink;
            appInfo.liveTool.showPage(this.pages[pageID].page);
        }
        else console.log('invalid pageID?: ' + pageID);
        
    }
    
    
}

var appPage = new AppPage();
export default appPage;
