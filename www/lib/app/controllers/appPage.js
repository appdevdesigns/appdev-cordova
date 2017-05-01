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

import ABApplication from 'lib/AppBuilder/models/ABApplication.js';
import ABPage from 'lib/AppBuilder/models/ABPage.js';
import ABObject from 'lib/AppBuilder/models/ABObject.js';

class AppPage extends Page {
    
    constructor() {
        super('opstool-app');
        
        this.rootAppID = null;
        
        // Reference object containing all the apps
        this.apps = {
        /*
            <appID>: {
                'app': <ABApplication>,
                'pages': [ <ABPage>, <ABPage>, ... ],
                'mainPage': <reference to this.pages[pageID]>
            },
            <appID2>: { ... },
            <appID3>: { ... },
            ...
        */
        };
        
        // Reference object containing all the root pages
        this.pages = {
        /*
            <pageID>: {
                'page': <ABPage>,
                'appLink': <reference to this.apps[appID]>,
                'liveTool': <ABLiveTool>,
                '$element': <jQuery>
            },
            <pageID2>: { ... },
            <pageID3>: { ... },
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
        
        navbar.on('resize', () => {
            this.resize();
        });
        
        server.on('sessionReady', () => {
            this.loadData();
        });
        
        // Webix wants to make <body> unscrollable.
        // Ain't nobody got time for that.
        //$('body').css({ overflow: 'scroll' });
    }
    
    
    /**
     * Loads apps and pages from the server and instantiates them on
     * the page.
     *
     * @return {Deferred}
     */
    loadData() {
        var dfd = $.Deferred();
        var actions = server.getUserActions();
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
                                app.translate && app.translate();
                                var appPageCount = 0;
                                
                                // Build the apps reference object
                                this.apps[app.id] = {
                                    'app': app,
                                    'pages': app.pages,
                                };
                                
                                // Build the pages reference object
                                app.pages.forEach((page) => {
                                    // Only root pages
                                    if (!page.parent) {
                                        // Only if permissions match
                                        if (actions.indexOf(page.permissionActionKey) >= 0) {
                                            this.pages[page.id] = {
                                                'page': page,
                                                'appLink': this.apps[app.id],
                                            };
                                            appPageCount += 1;
                                        }
                                    }
                                });
                                
                                if (appPageCount == 0) {
                                    delete this.apps[app.id];
                                } else {
                                    // First app with root pages is the root app
                                    this.rootAppID = this.rootAppID || app.id;
                                }
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
                // via ABApplication.findAll() does not contain all of the 
                // deep associations.
                
                var pageIDs = [];
                for (var pageID in this.pages) {
                    pageIDs.push({ id: pageID });
                }
                
                // Sails can't handle more than ~20 items in a findAll OR group
                // so need to break it up into smaller batches
                var pageBatches = [];
                while (pageIDs.length > 0) {
                    pageBatches.push(pageIDs.splice(0, Math.min(20, pageIDs.length)));
                }
                
                var pageList = [];
                async.each(pageBatches, (batchPageIDs, nextBatch) => {
                    ABPage.findAll({ or: batchPageIDs })
                    .fail(nextBatch)
                    .done((list) => {
                        if (!list || !list[0]) nextBatch();
                        else {
                            // `list` is actually a CanJS Map object.
                            // Can't use Array.concat() on it.
                            list.forEach((page) => {
                                pageList.push(page);
                            });
                            nextBatch();
                        }
                    });
                }, (err) => {
                    if (err) next(err);
                    else if (pageList.length < 1) {
                        next(new Error('No pages found'));
                    }
                    else {
                        pageList.forEach((populatedPage) => {
                            populatedPage.translate && populatedPage.translate();
                            // Replace the old shallow ABPage with the
                            // new deep one.
                            this.pages[populatedPage.id]['page'] = populatedPage;
                        });
                        // Replace in the app list also
                        for (var appID in this.apps) {
                            var appInfo = this.apps[appID];
                            for (var i=0; i<appInfo.pages.length; i++) {
                                var pageID = appInfo.pages[i].id;
                                if (this.pages[pageID]) {
                                    appInfo.pages[i] = this.pages[pageID]['page'];
                                }
                            }
                        }
                        next();
                    }
                });
            },
            
            (next) => {
                this.setPageLinks(this.rootAppID);
                next();
            },
            
            (next) => {
                // Instantiate ABLiveTool objects
                for (var pageID in this.pages) {
                    var pageInfo = this.pages[pageID];
                    var page = pageInfo.page;
                    var appInfo = pageInfo.appLink;
                    var app = appInfo.app;
                    
                    // Skip non-root pages
                    if (page.parent) continue;
                    
                    // Record the first root page
                    appInfo.mainPage = appInfo.mainPage || pageInfo;
                    
                    /*
                    pageInfo.$element = $('<div>')
                        .hide()
                        .appendTo(this.$element);
                    
                    pageInfo.liveTool = new LiveTool(pageInfo.$element, {
                        app: app.id,
                        page: pageID,
                    });
                    */
                }
                
                this.showApp(this.rootAppID);
                next();
            }
        
        ], (err) => {
            this.emit('loadingDone');
            if (err) {
                this.$element.html(`
                    <div class="alert alert-warning" role="alert">
                        No data found on the server
                    </div>
                    
                    <code class="well">${err.message || ''}</code>
                `);
                dfd.reject(err);
            }
            else {
                navbar.showLinks();
                dfd.resolve(this.rootAppID);
            }
        });
        
        return dfd;
    }
    
    
    clearData() {
        this.rootAppID = null;
        this.apps = {};
        this.pages = {};
        this.$element.empty();
        navbar.setApps();
        navbar.setPages();
        navbar.hideLinks();
    }
    
    
    setPageLinks(pageID) {
        // Populate navbar app links
        var appList = {};
        for (var appID in this.apps) {
            var app = this.apps[appID].app;
            appList[appID] = app.label || app.name;
        }
        navbar.setApps(appList);
        
        // Populate navbar page links for the root app
        var pageList = {};
        this.apps[pageID].pages.forEach((page) => {
            if (!page.parent) {
                pageList[page.id] = page.label || page.name;
            }
        });
        navbar.setPages(pageList);
    }
    
    
    /**
     *
     */
    startPage(pageID) {
        var pageInfo = this.pages[pageID];
        if (!pageInfo) {
            console.log(new Error('Invalid pageID'));
            return false;
        }
        
        var page = pageInfo.page;
        var appInfo = pageInfo.appLink;
        var app = appInfo.app;
        
        // Skip non-root pages
        if (page.parent) return false;
        
        pageInfo.$element = $('<div>')
            .appendTo(this.$element);
        
        pageInfo.liveTool = new LiveTool(pageInfo.$element, {
            app: app.id,
            page: pageID,
        });
        
        return true;
    }
    
    
    /**
     * Show a loaded ABLiveTool app on the page
     */
    showApp(appID) {
        if (this.apps[appID]) {
            this.setPageLinks(appID);
            this.showPage( this.apps[appID].mainPage.page.id );
        }
    }
    
    
    /**
     * Show a loaded ABLiveTool app's page on the page
     */
    showPage(pageID) {
        if (this.pages[pageID]) {
            this.$element.children().hide();
            var pageInfo = this.pages[pageID];
            
            if (pageInfo.$element) {
                pageInfo.$element.show();
                pageInfo.liveTool.showPage(pageInfo.page);
                setTimeout(() => {
                    // There is a bug where the page will not fully display
                    // when it is first shown. Try to force it to show.
                    this.resize();
                }, 150);
            } else {
                this.startPage(pageID);
            }
            
            navbar.setActivePage(pageID);
        }
    }
    
    
    resize() {
        var $window = $(window);
        //var width = $window.width();
        var height = $window.height() - this.$element.offset().top - 28;
        
        //console.log(width + ' x ' + height);
        for (var pageID in this.pages) {
            var pageInfo = this.pages[pageID];
            //if (pageInfo.$element.is(':visible')) { // <-- slower?
            if (pageInfo.$element && pageInfo.$element.css('display') != 'none') {
                pageInfo.liveTool.resize(height);
            }
        }
    }
    
    
}

var appPage = new AppPage();
export default appPage;
