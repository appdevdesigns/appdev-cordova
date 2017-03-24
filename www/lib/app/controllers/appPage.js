/**
 * @class AppPage
 * 
 * This is the container page for the contained OpsPortal application.
 *
 * Exports a singleton instance of the AppPage class.
 */
 "use strict";

import $ from 'jquery';
//import async from 'async';
//import _ from 'lodash';
import Page from 'lib/app/page.js';

const pageID = 'opstool-app';

class AppPage extends Page {
    constructor() {
        super(pageID);
    }
    
    init() {
        this.$element.text('This is the app');
    }
}

var appPage = new AppPage();
export default appPage;
