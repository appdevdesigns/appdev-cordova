/**
 * @class AppPage
 * 
 * This is the container page for the contained OpsPortal application.
 *
 * Exports a singleton instance of the AppPage class.
 */
"use strict";

//import $ from 'jquery';
import Page from 'lib/app/page.js';
import 'lib/AppBuilder/ABLiveTool.js';
import server from 'lib/app/server.js';

var LiveTool = AD.controllers.opstools.BuildApp.ABLiveTool;
const pageID = 'opstool-app';

class AppPage extends Page {
    constructor() {
        super(pageID, 'lib/app/templates/app.html');
    }
    
    init() {
        
        this.$elementLiveTool = this.$element.find('.ab-livetool');
        
        server.once('sessionReady', () => {
            this.liveTool = new LiveTool(this.$elementLiveTool, {
                app: 13,
                page: 64,
            });
        });
        
    }
}

var appPage = new AppPage();
export default appPage;
