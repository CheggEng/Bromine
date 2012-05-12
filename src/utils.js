var Bromine = Bromine || {};
!function(){
    var utils = this.utils = {};

    this.Bind = function(){
        var i,fn;

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
     */
    this.Options = function Options(){
        var key;
        if (!this.options) this.options = {};

        for (key in this.defaultOptions) if (this.defaultOptions.hasOwnProperty(key)) {
            this.options[key] = this.defaultOptions[key];
        }

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

}.apply(Bromine,[]);
