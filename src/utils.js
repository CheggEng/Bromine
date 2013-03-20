/*!Copyright 2012 Chegg inc

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.   
 */
(function (root, factory) {
    if (typeof exports === 'object') {
        var Events = require('Bromine/Events').Events;

        module.exports = factory(Events);

    } else if (typeof define === 'function' && define.amd) {
        define(['Bromine/Events'], function (Events) {
            return factory(Events.Events);
        });
    } else {
        root.Bromine.utils = factory(root.Events);
    }
}(this, function (Events) {
    /**
     * @module Bromine.utils
     */
    var utils = {};

    /**
     * this mixin automatically creates a `bound` collection of functions
     * @class Bind
     */
    utils.Bind = function(){
        var i,fn;

        /**
         * collection of bound function
         * @property bound
         * @type {Object}
         * @protected
         */
        this.bound = {};

        if (!this.bind) return;

        for (i=0; fn = this.bind[i]; i++){
            if (this[fn]) this.bound[fn] = this[fn].bind(this);
        }
    };

    /**
     *  A simple mixin for providing and options argument.
     *  If the object has a defaultOptions instance it will set them.
     *
     *  mixing also provides the setOptions method.
     *  other than settting the options, any key with the on* signiture (onLoad, onComplete etc)
     *  will be added as an event
     *
     *  @class Options
     */
    utils.Options = function Options(){
        var key;
        if (!this.options) this.options = {};

        for (key in this.defaultOptions) if (this.defaultOptions.hasOwnProperty(key)) {
            this.options[key] = this.defaultOptions[key];
        }

        /**
         * @method setOptions
         * @param {Object} options
         * @chainable
         */
        this.setOptions = function(options){
            var key;
            if (typeof options !== 'object' || options === null) return;
            for (key in options) if (options.hasOwnProperty(key)){
                if (key in this.options) this.options[key] = options[key];
                if (/^on[A-Z][a-zA-Z]+/.test(key) && this.addEvent && typeof options[key] == 'function') this.addEvent(utils.Events.removeOn(key),options[key]);
            }

            return this;
        };
    };

    utils.Events = Events;

    /**
     * calculates the offsets of an element relevant to one of it's parent
     * @method calculateOffsets
     * @static
     *
     * @param {element} element
     * @param {element} [container] default to `document.body`
     *
     * @return {object} {left, top}
     */
    utils.calculateOffsets = function (element, container) {
        var offsetParentElm = element,
            offsetParentOffsetLeft = 0,
            offsetParentOffsetTop = 0;

        if (!container) container = document.body;

        while (offsetParentElm && (offsetParentElm != container)) {
            offsetParentOffsetLeft += offsetParentElm.offsetLeft;
            offsetParentOffsetTop += offsetParentElm.offsetTop;
            offsetParentElm = offsetParentElm.offsetParent;
        }

        return {
            left: offsetParentOffsetLeft,
            top: offsetParentOffsetTop
        };
    };

    return utils;
}));
