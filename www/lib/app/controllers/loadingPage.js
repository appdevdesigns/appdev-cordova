/**
 * @class LoadingPage
 * 
 * This is a loading animation that is displayed by default as the app is
 * starting up. It may be invoked as needed with `show()`. Unlike other pages,
 * this also provides an `overlay()` method, which will show the loading
 * animation translucently layered on top of whatever page is currently active.
 *
 * Exports a singleton instance of the LoadingPage class.
 */
 "use strict";

//import $ from 'jquery';
//import async from 'async';
//import _ from 'lodash';
import Page from 'lib/app/page.js';

const pageID = 'loading-animation';

class LoadingPage extends Page {
    constructor() {
        super(pageID);
    }
    
    init() {
    }
    
    show() {
        this.$element.removeClass('overlay');
        this.$element.show();
    }
    
    hide() {
        this.$element.hide();
    }
    
    // Translucent overlay on top of another page
    overlay() {
        this.$element.addClass('overlay');
        this.$element.show();
    }
    
}

var loadingPage = new LoadingPage();
export default loadingPage;
