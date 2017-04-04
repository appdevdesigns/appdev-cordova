"use strict";

import menu from './menu.js';
import grid from './grid.js';
import form from './form.js';
import view from './view.js';
import link from './link.js';
import tab from './tab.js';

var componentManager = function () { };

var components = [
    menu,
    grid,
    form,
    view,
    link,
    tab,
];

components.forEach((component) => {
    // Override getEditView function to pass the componentManager parameter. 
    if (component.getEditView)
        component.getEditView = component.getEditView.bind(component.getEditView, componentManager);

    // Override getPropertyView function to pass the componentManager parameter. 
    if (component.getPropertyView)
        component.getPropertyView = component.getPropertyView.bind(component.getPropertyView, componentManager);
});


componentManager.getAllComponents = function () {
    return components;
};

/**
 getComponent()
 *
 * return the Component object by it's name.
 *
 * @param {string} name  The unique key to lookup the Component
 * @return {Component} or null.
 */
componentManager.getComponent = function (name) {
    if (!name) return null;

    var component = components.filter(function (comp) {
        return comp.getInfo && comp.getInfo().name.trim().toLowerCase() == name.trim().toLowerCase();
    });

    if (component && component.length > 0) {
        return component[0];
    }
    else
        return null;
};

componentManager.setEditInstance = function (editInstance) {
    if (editInstance.editViewId) {
        // Clone component instance
        var copyInstance = $.extend(true, {}, editInstance);

        // Change view id
        copyInstance.viewId = editInstance.editViewId;

        componentManager.editInstance = copyInstance;
    }
    else {
        componentManager.editInstance = editInstance;
    }
};

componentManager.editStop = function () {
    components.forEach(function (comp) {

        // if the component defines an .editStop() method directly
        if (comp.editStop)
            comp.editStop();
        else {

            // or the component defines a .propertyView in it's getInfo()
            var compInfo = comp.getInfo();
            if (compInfo.propertyView && $$(compInfo.propertyView) && $$(compInfo.propertyView).editStop) {
                $$(compInfo.propertyView).editStop();
            }
        }
    });
};

componentManager.resize = function (height) {
    components.forEach(function (comp) {
        if (comp.resize)
            comp.resize(height);
    });
};

export default componentManager;
