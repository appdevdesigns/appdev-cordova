// Requires the global `AD` object
"use strict";

var __siteListLanguage = null;  // the list of languages in our site:
var __siteLanguages = null;     // hash of language.id : { language obj } 
var _hashLabel = null;
var __lookups = {}; // hash of { context : {deferred} }

/**
 * @private
 * This is where the labels are stored.
 */
var store = {
/*
    "language_code": {
        "label_key1": "label_label1",
        "label_key2": "label_label2"
    },
    "en": {
        "OK": "Okay",
        "Cancel": "Cancel"
    },
    "zh-hans": {
        "OK": "好",
        "Cancel": "取消"
    },
    "fr": {
        "OK": "Bien",
        "Cancel": "Annuler"
    }
*/
}


/**
 * Used internally to track if a warning was already sent to the console.
 */
var warnings = {};
var warn = function (langCode) {
    if (!warnings[langCode]) {
        if (typeof console == 'object') {
            console.log("Warning: language not found [" + langCode + "]");
        }
        warnings[langCode] = true;
    }
};




var langObj = {
    /**
     * The default language used in operations when nothing is specified.
     */
    currentLanguage: 'en',

    /**
     * @function list
     * Returns a hash of the current languages in the framework.
     * 
     * This is an async function since it has to request the info from the server.
     * @codestart
     * AD.lang.list()
     * .then(function(list){
     *     console.log(list);  // { "en" : "English", "ko": "Korean", "zh-hans":"Chinese" }
     * })
     * @codeend
     * @return {deferred} 
     */
    list() {
        var dfd = AD.sal.Deferred();

        if (__siteListLanguage) {
            dfd.resolve(__siteListLanguage);
        } else {

            var rebuildLanguageList = function() {
                __siteListLanguage = {};

                for(var id in __siteLanguages) {
                    var item = __siteLanguages[id];
                    __siteListLanguage[item.language_code] = item.language_label;
                }
            }

            AD.comm.socket.get({
                url:'/appdev-core/sitemultilinguallanguage'
            })
            .fail(function(err){
                AD.error.log('Unable to request SiteMultilingualLanguage information.', err);
                dfd.reject(err);
            })
            .then(function(list){

                __siteLanguages = {};

                list.forEach(function(item){
                    __siteLanguages[item.id] = item;
                });

                rebuildLanguageList();

                dfd.resolve(__siteListLanguage);
            })

            // subscribe to changes in our language's and update our list.
            AD.comm.socket.subscribe('sitemultilinguallanguage', function(message, data){
                switch(data.verb) {
                    case 'created':
                    case 'updated':
                        __siteLanguages[data.id] = data.data;
                        break;

                    case 'destroyed':
                        delete __siteLanguages[data.id];
                        break;

                }

                rebuildLanguageList();
            })

        }

        return dfd;
    },



    /**
     * @function setCurrentLanguage
     * Sets the default language code to be used for all operations that don't
     * specify one.
     * @param [string] lang
     */
    setCurrentLanguage(lang) {
        langObj.currentLanguage = lang;
    },


    label: {
        /**
         * @function setLabel
         * Set a single label definition.
         * @param [string] key
         * @param [string] label
         * @param [string] langCode (Optional)
         */
        setLabel(key, label, langCode) {
            langCode = langCode || langObj.currentLanguage;
            if (!store[langCode]) {
                store[langCode] = {};
            }
            store[langCode][key] = label;
    
            // update any current labels that are using key:
            var toUpdate = AD.controllers.Label.getLabel(key);
            if (toUpdate) {
                toUpdate.translate();
            }
            
        },

        /**
         * @function importLabels
         * Sets many label definitions at once.
         * @param [object] data
         *     A JSON object in this format:
         *     {
         *         "en": {
         *             "label key A": "en translation A",
         *             "label key B": "en translation B",
         *             ...
         *         },
         *        ...
         *     }
         */
        importLabels(data) {
            for (var lang in data) {
                for (var key in data[lang]) {
                    langObj.label.setLabel(key, data[lang][key], lang);
                }
            }
        },


        /**
         * @function getLabel
         * Retrieve a label given its unique key.
         *
         * @param [string] key
         * @param [array] subs (Optional)
         *     If the retrieved label contains %s placeholders, then those will be
         *     substituted with provided in this argument.
         * @param [string] langCode (Optional)
         * @return [string|false]
         *      False is returned if there was no match for the langCode or key.
         */
        getLabel(key, subs, langCode) {
    
            // if key is : { key:'key', context:'context' }
            if (typeof key == 'object') {
                key = key.key;
            }
    
            // When subs not given
            if (Object.prototype.toString.call(subs) != '[object Array]') {
                langCode = subs;
                subs = [];
            }
            // When langCode not given
            langCode = langCode || langObj.currentLanguage;
    
            // langCode not found
            if (!store[langCode]) {
                warn(langCode);
                return false;
            }
    
            // Key not found
            if (!store[langCode][key]) {
                //return "[" + langCode + "]" + key;
                return false;
            }
    
            var label = store[langCode][key] || key;
    
            // Substitutions
            label = label.replace(/%%/g, '\\%\\');
            while (subs.length && label.match(/%s/)) {
                label = label.replace(/%s/, subs.shift());
            }
            label = label.replace(/\\%\\/g, '%');
    
            return label;
        },



        /**
         * @function getLabelSpan
         * Retrieve a <span>label</span> definition given its unique key.
         *
         * This is useful for templates to generate spans that will be 
         * converted into label objects by our UI Controllers.
         *
         * @codestart
         *
         * @codeend
         *
         * @param [string] key
         * @param [array] subs (Optional)
         *     If the retrieved label contains %s placeholders, then those will be
         *     substituted with provided in this argument.
         * @param [string] langCode (Optional)
         * @return [string|false]
         *      False is returned if there was no match for the langCode or key.
         */
        getLabelSpan(key, subs, langCode) {
    
            var context = '';
    
            // if key is : { key:'key', context:'context' }
            if (typeof key == 'object') {
                key = key.key;
                context = key.context;
            }
    
            var label = AD.lang.label.getLabel(key, subs, langCode);
    
            var span = '';
    
            var contextAttr = '';
            if (context != '') {
                contextAttr = AD.controllers.Label.constants.contextAttribute+'="'+context+'"';
            }
    
            if (label) {
                span = '<span '+AD.controllers.Label.constants.keyAttribute+'="'+key+'" '+contextAttr+' >'+label+'</span>';
            } else {
                span = '<span '+AD.controllers.Label.constants.keyAttribute+'="'+key+'" '+contextAttr+'>'+key+'</span>';
            }
    
            return span;
        },


        lookup(context) {
            // make sure deferred exists
            if (!__lookups[context]) {
                var dfd = AD.sal.Deferred();
    
                // tell jQuery to load the context:
                AD.ui.jQuery.getScript('/site/labels/'+context+'.js')
                .fail(function(err){
                    AD.error.log('AD.lang.label.lookup(): error loading labels for context ['+context+']', {error:err, context:context });
                    dfd.reject(err);
                })
                .done(function(){
                    
                    // .getScript()  isn't guaranteed to have executed the loaded .js
                    // before this is called, so push this back to give it 
                    // a chance to finish executing.
                    AD.sal.setImmediate(function(){  dfd.resolve(); });
                });
    
                __lookups[context] = dfd;
            }
    
            // return the deferred for this context
            return __lookups[context];
        },


        translate($el) {
            var keyAttr = AD.controllers.Label.constants.keyAttribute;
            var labels = $el.find('[' + keyAttr + ']');
    
            var ADlabels = []; // array of Label instances
            
            labels.each(function(){
                ADlabels.push(new AD.controllers.Label(AD.ui.jQuery(this)));
            });
    
            return ADlabels;
        },
    }
};

export default langObj;
