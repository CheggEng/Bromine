!function(){
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
    
    this.Bromine = {
        utils: utils    
    };
}.call(this);
