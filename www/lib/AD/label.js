import $ from 'jquery';
import can from 'can';

/**
 * @class AD.controllers.Label
 * This is the controller object used for each label on the page.
 */
var Label = can.Control.extend({

    // Technically not really constants, but you get the idea
    constants: {

        // (optional) the label's context that will allow us to lookup the 
        // translation if no matching label key is currently found
        contextAttribute: "app-label-context",

        // The label key will be determined by the value of this attribute on
        // the raw text element.
        keyAttribute: "app-label-key",

        // The label's current language will be reflected in this attribute
        langAttribute: "app-label-lang",

        // After initializing, the text element will be assigned this CSS class
        // for identification.
        cssClass: "app-label",

        // A reference to the controller object will be stored in the element
        // via jQuery data under this name.
        jQueryData: "AD-Label"
    },


    /**
     * @function keylessCreate
     *
     * Initialize an element into a new Label object. The element's original
     * html content will be used as the label key.
     *
     * @param jQuery $element
     * @return Label
     */
    keylessCreate($element) {

        // make sure $element is actually a jQuery object
        if (!$element.html) {
            $element = $($element);
        }

        // Use the original text as the label key
        var originalText = $element.html();
        $element.attr(this.constants.keyAttribute, originalText);
        return this.create($element);
    },


    /**
     * @function create
     *
     * Initialize an element into a new Label object. The element must
     * have the label key embedded as an attribute under "app-label-key". Any
     * existing html content in the element will be replaced.
     *
     * @param jQuery $element
     * @return Label
     */
    create($element) {
        var labelInstance = new Label($element);
        return labelInstance;
    },


    /**
     * @function transform
     *
     * Modify the HTML content of a raw text element to the standard label
     * structure.
     *
     * @param jQuery $element
     * @return jQuery
     *      Returns the SPAN element that will hold the actual label text.
     */
    transform($element) {
        var $span;
        if ($element.is('input')) {
            // textbox
            $span = $element;
        }
        else {
            $span = $('<span>');

            // Discard the original text
            $element.empty();

            $element.append($span);
            $element.addClass(this.constants.cssClass);
        }

        // TODO??: provide pop-up translator selection icon

        return $span;
    },

    // Will be merged with this.options in each object instance
    defaults: {
    },

    // A hash of references to all label objects currently in use.
    _hashLabels: {},  // key: LabelObj
    
    getLabel(key) {
        return this._hashLabels[key];
    },

    setLabel(label) {
        this._hashLabels[label.labelKey] = label;
    },

    /**
     * @function translateAll
     * Translates all label controls currently in existence.
     */
    translateAll(langCode) {
        // `this` is the Label class
        $.each(this._hashLabels, function (key, label) {
            // `this` is now a Label instance
            label.translate(langCode);
        });
    }

}, {

    init($element) {
        
        this.labelKey = $element.attr(this.constructor.constants.keyAttribute);
        this.labelContext = $element.attr(this.constructor.constants.contextAttribute);
        this.labelContextAttempt =0;

        if ($element.is('input')) {
            this.originalText = $element.prop('placeholder');
        } else {
            this.originalText = $element.text();
        }
        
        // Skip if no label key, or if this element was already initialized
        if (this.labelKey && !$element.hasClass(this.constructor.constants.cssClass)) {
            // Init the HTML
            this.$span = this.constructor.transform($element);
            
            // Update static hash
            this.constructor.setLabel(this);
            
            // Provide a reference to this Label object on the HTML element
            $element.data(this.constructor.constants.jQueryData, this);

            this.translate(); // translate into current default language
        }
    },

    destroy() {

        // Update static hash
        delete this.constructor._hashLabels[this.labelKey];

        can.Control.prototype.destroy.call(this);
    },

    /**
     * @function translate
     * @param string langCode (Optional)
     * Changes the text in the label to 
     */
    translate(langCode) {
        langCode = langCode || AD.lang.currentLanguage;
        var self = this;
        var label = AD.lang.label.getLabel(this.labelKey, langCode);
        
        // Textbox placeholder translation
        if (this.$span.is('input')) {
            this.$span.prop('placeholder', label || '['+langCode+']' + this.originalText);
            return;
        }
        
        // Remove any previous event bindings on the label
        this.$span.off('.label');
        
        // if no translation found
        if (label === false) {

            if ((this.labelContext) && (this.labelContextAttempt < 10)) {
                // request a multilingual lookup 
                // and update when ready
                AD.lang.label.lookup(this.labelContext)
                .fail(function(err){

                })
                .then(function(){
                    
                    setTimeout(function(){ 
                        self.labelContextAttempt++;
                        self.translate();
                    }, 100);
                })

            } else {

                // Fall back on displaying original text if no translation was found

                label = '['+langCode+']' + this.originalText;
                
                // Show label key on mouseover so admins know
                // which ones they need to add.
                this.$span.on('mouseenter.label', function(ev) {
                    self.$span.text('[' + self.labelKey + ']');
                });
                this.$span.on('mouseleave.label', function(ev) {
                    self.$span.text(label);
                });
            }
        }

        this.$span.html(label);
        this.element.attr(this.constructor.constants.langAttribute, langCode);
    },

    // Listen for globally published messages requesting translation
    "AD.label.translate subscribe": function (langCode) {
        this.translate(langCode);
    }

});

export default Label;
