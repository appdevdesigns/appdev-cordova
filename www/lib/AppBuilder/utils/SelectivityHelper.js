"use strict";
import 'lib/AD.js';
import $ from 'jquery'; // needed because selectivity doesn't detect the globally loaded $
import selectivity from 'selectivity/jquery';

export default {
    renderSelectivity: function (node, cssClass, readOnly) {
        var self = this;

        if (!(node instanceof jQuery)) node = $(node);

        // Initial multi-combo
        node.find('.' + cssClass).selectivity('destroy');
        node.find('.' + cssClass).selectivity({
            allowClear: true,
            multiple: true,
            removeOnly: true,
            readOnly: readOnly || false,
            showDropdown: false,
            showSearchInputInDropdown: false,
            placeholder: AD.lang.label.getLabel('ab.object.noConnectedData') || "No data selected"
        }).on('change', function (ev) {
            // Trigger event
            $(self).trigger('change', {
                event: ev,
                itemNode: $(this)
            });
        });
    },

    setData: function (node, data) {
        if (!(node instanceof jQuery)) node = $(node);

        if (node.selectivity) {
            var copied = data.slice();
            copied = copied.filter(function (d) { return d.id; });
            copied = $.map(copied, function (d) {
                if (!d.text) d.text = '[ID: #id#]'.replace('#id#', d.id);
                return d;
            });
            node.selectivity('data', copied);
        }
    },

    getData: function (node) {
        if (!(node instanceof jQuery)) node = $(node);

        if (node.selectivity)
            return node.selectivity('data');
        else
            return null;
    }

};
