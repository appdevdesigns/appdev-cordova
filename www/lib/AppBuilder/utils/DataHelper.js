"use strict";

import async from 'async';
import modelCreator from 'lib/AppBuilder/utils/ModelCreator.js';
import dataFieldsManager from 'lib/AppBuilder/data_fields/dataFieldsManager.js';

export default {
    modelCreator: modelCreator,

    normalizeData: function (application, objectId, columns, data, ignoreTranslate) {
        var self = this,
            q = new AD.sal.Deferred(),
            normalizeDataTasks = [],
            list;

        if (!data) {
            q.resolve();
            return q;
        }
        else if (data instanceof webix.DataCollection) {
            list = data.AD.__list;  // Get Can.Map
        }
        else if (!data.forEach) {
            list = [data]; // Convert to array
        }
        else {
            list = data; // It is Can.Map
        }

        var objectModel = application.objects.filter(function (obj) { return objectId == obj.id });
        if (objectModel && objectModel[0]) objectModel = objectModel[0];

        var linkColumns = columns.filter(function (col) { return col.setting.linkObject }) || [], // Get link columns
            dateColumns = columns.filter(function (col) { return col.setting.editor === 'date' || col.setting.editor === 'datetime'; }) || [];// Get date & datetime columns

        if (list.forEach) {
            list.forEach(function (row) {
                normalizeDataTasks.push(function (callback) {
                    // Translate
                    if (!ignoreTranslate && row.translate) row.translate();

                    // Set _dataLabel
                    if (row._dataLabel == null && objectModel) {
                        var dataLabel = objectModel.getDataLabel(row.attr());
                        row.attr('_dataLabel', dataLabel);
                    }

                    var linkTasks = [];

                    linkColumns.forEach(function (linkCol) {
                        if (row[linkCol.name] == null) {
                            if (linkCol.setting.linkType === 'collection')
                                row.attr(linkCol.name, []);
                            else
                                row.attr(linkCol.name, '');

                            return;
                        }

                        linkTasks.push(function (ok) {
                            var linkObj = application.objects.filter(function (obj) { return obj.id == linkCol.setting.linkObject; })[0],
                                linkedData = [];

                            // Check Linked object is deleted
                            if (linkObj == null) return ok();

                            // Get linked object model
                            var linkObjModel = modelCreator.getModel(application, linkObj.name);

                            async.series([
                                // Find labels of linked fields
                                function (next) {
                                    var connectDataIds = [];

                                    if (row[linkCol.name] == null) {
                                        return next();
                                    }
                                    else if (row[linkCol.name].forEach) {
                                        row[linkCol.name].forEach(function (val) {
                                            if (val && val._dataLabel == null)
                                                connectDataIds.push({ id: val.id || val });
                                        });
                                    }
                                    else if (row[linkCol.name]._dataLabel == null) {
                                        var keyName = 'id';
                                        var keyValue = row[linkCol.name][keyName] || row[linkCol.name];
                                        if (typeof keyValue == 'number' || typeof keyValue == 'string') {
                                            connectDataIds.push({ id: keyValue });
                                        } else {
                                            console.log('Non-standard key name for ' + linkCol.name);
                                            console.log(row[linkCol.name]);
                                        }
                                    }

                                    if (!connectDataIds || connectDataIds.length < 1) return next();

                                    linkObjModel.findAll({ or: connectDataIds })
                                        .fail(next)
                                        .then(function (result) {
                                            result.forEach(function (linkVal) {

                                                if (linkVal._dataLabel == null) {
                                                    if (linkVal.translate) linkVal.translate();
                                                    linkVal.attr('_dataLabel', linkObj.getDataLabel(linkVal.attr()));
                                                }
                                            });

                                            linkedData = result;
                                            next();
                                        });
                                },
                                // Set label to linked fields
                                function (next) {
                                    if (!linkedData || linkedData.length < 1) return next();

                                    if (row[linkCol.name].forEach) {
                                        row[linkCol.name].forEach(function (val, index) {
                                            if (val._dataLabel == null) {
                                                var linkVal = linkedData.filter(function (link) { return link.id == val.id });
                                                if (!linkVal[0]) return;

                                                var dataLabel = linkVal[0].attr();

                                                // FIX : CANjs attr to set nested value
                                                if (row.attr)
                                                    row.attr(linkCol.name + '.' + index, dataLabel);
                                                else
                                                    row[linkCol.name + '.' + index] = dataLabel;
                                            }
                                        });
                                    }
                                    else if (row[linkCol.name]._dataLabel == null) {
                                        var linkVal = linkedData.filter(function (link) { return link.id == (row[linkCol.name].id || row[linkCol.name]) });
                                        if (!linkVal[0]) return next();

                                        var dataLabel = linkVal[0].attr();

                                        if (row.attr)
                                            row.attr(linkCol.name, dataLabel);
                                        else
                                            row[linkCol.name] = dataLabel;
                                    }

                                    next();
                                }
                            ], ok);
                        });
                    });

                    async.parallel(linkTasks, callback);
                });

                // Convert string to Date object
                if (dateColumns && dateColumns.length > 0) {
                    dateColumns.forEach(function (dateCol) {
                        if (row[dateCol.name] && !(row[dateCol.name] instanceof Date))
                            row.attr(dateCol.name, new Date(row[dateCol.name]));
                    });
                }

                // Set height of row ($height)
                columns.forEach(function (col) {
                    var rowHeight = dataFieldsManager.getRowHeight(col, row[col.name]);
                    if (rowHeight && (!row.$height || row.$height < rowHeight))
                        row.attr('$height', rowHeight);
                });

            });
        }

        async.parallel(normalizeDataTasks, function (err) {
            if (err) {
                q.reject(err);
            }
            else {
                q.resolve(data);
            }
        });

        return q;
    }


};
