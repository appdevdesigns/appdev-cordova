"use strict";
import 'lib/AD.js';


// The OpsPortal will define a global namespace for our added utilities:
if (typeof AD.op == 'undefined') AD.op = {};


/**
 * @class AD.op.Dialog
 *
 * This is a reusable Dialog tool for interacting with the User.
 *
 *
 */
AD.op.Dialog = {
    // Instance properties

    // Alert
    // A dialogue that popup with a message, and requires an [ok] button press


    // Confirm
    // A [Yes] [No] dialogue that pops up with a message
    Confirm: function (opts) {

        var title =     opts.title || AD.lang.label.getLabel('opp.dialog.confirm.confirmTitle') || "* Confirm";
        var message =   opts.text  || opts.message || AD.lang.label.getLabel('opp.dialog.confirm.confirmMsg') || "* Are you sure you want to do this?";

        var labelYes =  opts.labelYes || opts.ok || AD.lang.label.getLabel('opp.common.yes') ||  '* yes';
        var labelNo =   opts.labelNo  || opts.cancel || AD.lang.label.getLabel('opp.common.no') || "* no";

        // var fnYes = opts.fnYes || function () { };
        // var fnNo = opts.fnNo || function () { };


        webix.confirm({
            title: title,
            text: message,

            ok: labelYes, 
            cancel: labelNo,
        
            callback: function (result) {
                if (result) {
                    if (opts.fnYes) opts.fnYes();
                } else {
                    if (opts.fnNo) opts.fnNo();
                }

                if (opts.callback) opts.callback(result);
            }
        });


        // bootbox.dialog({
        //     title: title,
        //     message: message,
        //     buttons: {
        //         yes: {
        //             label: labelYes,
        //             className: 'btn-primary',
        //             callback: fnYes
        //         },
        //         no: {
        //             label: labelNo,
        //             className: 'btn-default',
        //             callback: fnNo
        //         }
        //     }
        // });


    },


    // ConfirmDelete
    // A Confirm dialogue geared towards deleting items.
    // [delete] [cancel]
    ConfirmDelete: function(opts) {


        AD.op.Dialog.Confirm({
            title: opts.title || AD.lang.label.getLabel('opp.dialog.confirm.deleteTitle') || "* Confirm Delete",
            ok: opts.ok || AD.lang.label.getLabel('opp.common.delete') || "* Delete", 
            cancel: opts.cancel || AD.lang.label.getLabel('opp.common.cancel') || "* Cancel",
            text: opts.text || opts.message || AD.lang.label.getLabel('opp.dialog.confirm.deleteMsg', ['this']) || "* Are you sure you want to delete this?",
            callback: function (result) {
                if (result) {
                    if (opts.fnYes) opts.fnYes();
                } else {
                    if (opts.fnNo) opts.fnNo();
                }

                if (opts.callback) opts.callback(result);
            }
        });

    }

    // Message
    // A simple message displayed to the user.  Can time out

}

