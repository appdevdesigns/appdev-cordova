"use strict";
import 'lib/AD.js';
import "lib/OpsPortal/load-image.all.min.js";

// The OpsPortal will define a global namespace for our added utilities:
if (typeof AD.op == 'undefined') AD.op = {};


/**
 * @class AD.op.Image
 *
 * This is a reusable image tool for displaying images on the DOM.
 *
 * The included library will ensure images are properly rotated
 * based upon their embedded EXIF data.
 *
 * expected usage:
 * @codestart
 * var img = new AD.op.Image(el, options);
 * img.loadUrl('url/here.jpg');
 * img.clear();
 * img.
 * @codeend
 *
 *
 */
AD.op.Image = can.Control.extend({
    // Static Properties
},{

    // Instance Properties:

    init: function (element, options) {
        var _this = this;
        options = AD.defaults({
            url:false,
            width:344       // default 
        }, options);
        this.options = options;

        // Call parent init
        this._super(element, options);

        function getSet (key,val) {
            if (typeof val == 'undefined') {
                // return the value

                if (_this.img.css) {
                    return _this.img.css(key);
                } else {
                    var h = _this.img.style[key];
                    if (h=="") h = _this.img[key];
                    return h;
                }
            } else {
                // set the value
                // make sure value is a "###px" value:
                if (val.toString().indexOf('px') == -1) {
                    val = val + "px";
                }

                if(_this.img.css) {
                    return _this.img.css(key, val);
                } else {
                    return _this.img.style[key] = val;
                }
            }
        }
        function createImagefn() {
            return {
                height:function(val){
                    return getSet('height', val);
                },

                width: function(val){
                    return getSet('width', val);
                }
            }
        }

        this.image = createImagefn();

        this.clear();

        var url = $(this.element).attr('opimage-url');
        if (url) {
            this.loadURL(url);
        }
    },



    clear: function() {
        $(this.element).empty();
        return this;
    },


    hide: function() {
        $(this.element).hide();
        return this;
    },


    render: function(options, cb) {
        var _this = this;

        if (this.blob) {

            var lI = loadImage(
                _this.blob,
                function (img) {
                    if(img.type === "error") {
                        _this.img = null;
                        AD.error.log("OpsImage.loadURL(): Error loading image " + url, {error:img});
                        if (cb) cb(img);

                    } else {
                        _this.img = img;
                        if(cb) cb(null, img);
                    }
                },
                {
                    maxWidth: _this.option('width', options),
                    orientation: _this.ori 
                }
            );
        }
    },


    /**
     *
     * @param {obj} options 
     *              options.shouldAppend : false
     */
    loadURL:function(url, options) {
        var _this = this;
        var dfd = AD.sal.Deferred();

        this.ori = 0;
        this.blob = null;

        options = options || {};
        if (typeof options.shouldAppend == 'undefined') {
            options.shouldAppend = true;
        }


        var xhr = new XMLHttpRequest();  
        xhr.open('GET', url, true);  
        xhr.responseType = 'blob';  
        xhr.onload = function(e) {  
             
            if (this.status == 200) {  
                _this.blob = this.response;  
                loadImage.parseMetaData(_this.blob, function(data) { //read image metadata to get orientation info  
                    if (data.exif) {  
                       _this.ori  = data.exif.get('Orientation');  
                    }  
                    _this.render(options, function(err, img) {
                        if(err) {
                            dfd.reject(img);
                        } else {
                            if (options.shouldAppend) {
                                $(_this.element).append(img);
                            }
                            // img.css('width', _this.option('width', options));
                            $(_this.element).trigger('load');

                            dfd.resolve(img);
                        }
                    });
                    // var lI = loadImage(
                    //     _this.blob,
                    //     function (img) {
                    //         if(img.type === "error") {
                    //             _this.img = null;
                    //             AD.error.log("OpsImage.loadURL(): Error loading image " + url, {error:img});
                    //             dfd.reject(img);

                    //         } else {
                    //             _this.img = img;
                    //             $(_this.element).append(img);
                    //             // img.css('width', _this.option('width', options));
                    //             $(_this.element).trigger('load');
                    //             dfd.resolve(img);
                    //         }
                    //     },
                    //     {
                    //         maxWidth: _this.option('width', options),
                    //         orientation: _this.ori 
                    //     }
                    // );

                });  
            }  
        };  
        xhr.send();  


        return dfd;
    },


    on: function(key, fn) {
        $(this.element).on(key, fn);
    },


    option:function(key, o) {
        o = o || {};

        return o[key] || this.options[key] || '';
    },


    show: function() {
        $(this.element).show();
        return this;
    }


});
