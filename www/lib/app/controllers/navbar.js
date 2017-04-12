/**
 * @class NavBar
 * 
 * This is the controller for navigation toolbar header.
 *
 * Exports a singleton instance.
 */
"use strict";

//import $ from 'jquery';
import Page from 'lib/app/page.js';
import server from 'lib/app/server.js';

class NavBar extends Page {

    constructor() {
        super('cdv-navbar', 'lib/app/templates/navbar.html');
    }
    
    
    // Overriding the parent class
    render() {
        return this.addHTML(this.template);
    }
    show() {
        this.$element.show();
        this.emit('show');
    }
    
    
    init() {
        this.$appMenu = this.$element.find('#navbar-app-menu');
        this.$pageArea = this.$element.find('#navbar-right-area');
        this.$sysMenu = this.$element.find('#navbar-system-menu');
        
        this.appID = null;
        this.pageID = null;
        
        this.$element.on('click', 'a', (ev) => {
            var $a = $(ev.target);
            var $li = $a.parent();
            var href = ($a.attr('href') || '').replace('#', '');
            
            if (href.length > 0) {
                if (href == 'app') {
                    var oldAppID = this.appID;
                    this.appID = $li.attr('app_id');
                    this.emit('click.app', this.appID, oldAppID);
                }
                else if (href == 'page') {
                    var oldPageID = this.pageID;
                    this.pageID = $li.attr('page_id');
                    this.emit('click.page', this.pageID, oldPageID);
                }
                else if (href == 'restart') {
                    window.location.reload();
                }
                else {
                    this.emit('click.' + href);
                }
            }
            
            ev.preventDefault();
        });
    }
    
    
    /**
     * Make the app and page links hidden
     */
    hideLinks() {
        this.$appMenu.hide();
        this.$pageArea.find('[page_id]').hide();
        this.$sysMenu.find("a[href='#profile']").hide();
        this.$sysMenu.find("a[href='#logout']").hide();
    }
    
    
    /**
     * Make the app and page links visible
     */
    showLinks() {
        if (this.$appMenu.find('[app_id]').length > 1) {
            this.$appMenu.show();
        }
        this.$pageArea.find('[page_id]').show();
        this.$sysMenu.find("a[href='#profile']").show();
        this.$sysMenu.find("a[href='#logout']").show();
    }
    
    
    /**
     * Make a page link appear in the active state
     */
    setActivePage(pageID) {
        this.$pageArea.find('.active').removeClass('active');
        this.$pageArea.find(`li[page_id='${pageID}']`).addClass('active');
    }
    
    
    /**
     * Set the app links
     *
     * @param {object} apps
     *      {
     *          <appID1>: <appLabel1>,
     *          <appID2>: <appLabel2>,
     *          ...
     *      }
     */
    setApps(apps = {}) {
        var $list = this.$appMenu.find('ul.dropdown-menu');
        var appIDs = Object.keys(apps);
        
        $list.empty();
        for (var appID in apps) {
            $(`<li app_id="${appID}"><a href="#app">${apps[appID]}</a></li>`)
                .attr('app_id', appID)
                .appendTo($list);
        }
        
        // Hide the app menu if there is only one app
        if (appIDs.length <= 1) {
            this.$appMenu.hide();
        }
    }
    
    
    /**
     * Set the page links
     *
     * @param {object} pages
     *      {
     *          <pageID1>: <pageLabel1>,
     *          <pageID2>: <pageLabel2>,
     *          ...
     *      }
     */
    setPages(pages = {}) {
        this.$pageArea.find('[page_id]').remove();
        for (var pageID in pages) {
            $(`<li page_id="${pageID}"><a href="#page">${pages[pageID]}</a></li>`)
                .attr('page_id', pageID)
                .prependTo(this.$pageArea);
        }
    }
    
    
}

var navbar = new NavBar();
export default navbar;
