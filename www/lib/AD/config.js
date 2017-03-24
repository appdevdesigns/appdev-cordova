"use strict";

/**
 * @private
 * This is where the config values are stored.
 */
var storage = {};

export default {
    
    /**
     * @function setValue
     * Set a single value definition.
     * @param [string] key
     * @param [string] value
     */
    setValue(key, value) {
        storage[key] = value;
    },
    
    /**
     * @function getValue
     * Retrieve a value from the config settings.
     *
     * @param [string] key   
     * @return [string|false]
     *      False is returned if there was no match for the key.
     */
    getValue(key) {
        
        // Key not found
        if (!storage[key]) {
            return false;
        }
        
        var value = storage[key];
        
        return value;
    },

};