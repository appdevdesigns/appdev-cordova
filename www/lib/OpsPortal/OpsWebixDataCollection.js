import 'lib/AD.js';
import 'lib/OpsPortal/opsportal-skin.js';

// The OpsPortal will define a global namespace for our added utilities:
if (typeof AD.op == 'undefined') AD.op = {};

/**
 * @class AD.op.WebixDataCollection
 * @parent 
 *
 * This is a generic OpsPortal helper for translating can.List() into a 
 * Webix DataCollection.
 *
 * We attempt to listen for changes in either object, and then update the
 * other.
 *
 */
AD.op.WebixDataCollection = function(List) {

    if (List.___webixDataCollection) {

        return List.___webixDataCollection;

    } else {


        var newData = [];


        List.forEach(function(item) {
            newData.push(item.attr ? item.attr() : item);
        })

        var dc = new webix.DataCollection({
            data: newData,

            on: {
                onAfterDelete: function(id) {

                    var model = dc.AD.getModel(id);

                    if (model) {

                        // Deleting an element from the DataCollection
                        // auto removes it from the can.List:
                        var index = List.indexOf(model);
                        // console.log('... list index to remove:'+index);
                        if (index >= 0) {
                            List.splice(index, 1);
                        }

                    }


                }
            }
        });


        List.___webixDataCollection = dc;
        List.bind('change', function(ev, attr, how, newVals, oldVals) {
            console.log('... List.change: ' + attr + ', ' + how + ', ' + newVals + ', ' + oldVals);


            // the attr value can be a complex descriptor:
            //  0.translations.0.role_label
            var partsAttr = attr.split('.'); // break into pieces

            function set() {

                // pull the data item that was changed
                var indx = partsAttr.shift();       // the first element is the List[indx];
                var model = List[indx];             // get that model

                // tell the DC to update the item related to this model
                dc.updateItem(model.getID(), model.attr());
            }

            if (how == 'add') {

                // if this was an embedded value, then treat as a set()
                if (partsAttr.length > 1) {
                    set();
                } else {

                    // else, add the newVals to the DC
                    newVals.forEach(function(item) {
                        dc.add(item.attr(), attr);
                        attr++;
                    })

                }

            } else if (how == 'set') {

                // a change happened in a value within our list.
                // we need to update the corresponding value in our DC:

                set();

            }

        });
        List.bind('remove', function(ev, oldVals, where) {
            oldVals.forEach(function(item) {
                dc.remove(item.getID());
            })
        });

        dc.AD = {};
        dc.AD.__list = List;


        // dc.AD.currModel()
        dc.AD.currModel = function() {

            // get the id of the current cursor position
            var id = dc.getCursor();
            return this.getModel(id);
        }

        // dc.AD.setModelObject = function( Model) {
        // 	dc.AD.__Model = Model;
        // }

        dc.AD.getModelObject = function() {
            if (dc.AD.__list._Klass) {
                return dc.AD.__list._Klass;
            } else {
                console.warn('! List object does not have _Klass set!', dc.AD.__list);
            }
            
            return null;
        }

        // dc.AD.getModel(id)
        dc.AD.getModel = function(id) {
            var model = null;

            // should return the current model from the List:
            List.forEach(function(item) {
                if (item.getID() + '' == id) {
                    model = item;
                }
            });

            return model;
        }

        dc.AD.destroyModel = function(id) {
            var model = this.getModel(id);
            if (model) {
                return model.destroy();
            } else {
                return AD.sal.Deferred().reject(new Error('dc.AD.destroyModel(): no model for id:' + id));
            }
        }

        return dc;
    }

};
