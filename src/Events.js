(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports.Events = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return {Events : factory()};
        });
    } else {
        root.Events = factory();
    }
}(this, function (){
    /**
     * @module Events
     */

    var compat = 'createEvent' in document,
        pseudo_regex = /([^:]+)(?:\:([^(]*)(?:\((.*)\))?)?/,
        addEvent, addEvents, fireEvent, removeEvent, addEventOnce, Events, fireLatchedEvent;

    //=================
    //    UTILITIES
    //=================

    //utility function for cross-browser
    function indexOf(arr,prop){
        if (arr.indexOf) return arr.indexOf(prop);
        else return String.prototype.indexOf(arr,prop);
    }

    //handles warnings set by the library
    function warn(error){
        if (Events.strict){
            throw new Error(error);
        }else if ('console' in window){
            if (console.error) console.error(error);
            else if (console.warn) console.warn(error);
            else console.log(error);
        }
    }

    /**
     * removes the on* prefix from event names
     * @method Events.removeOn
     * @static
     *
     * @param {string} type
     *
     * @return {string}
     */
    function removeOn(string){
        return string.replace(/^on([A-Z])/, function(full, first){
            return first.toLowerCase();
        });
    }

    /**
     * returns a structured data object about a type's pseudo-events
     *
     * @method getPseudo
     * @private
     * @static
     *
     * @param {string} type
     *
     * @return {Object} data
     */
    function getPseudo(string){
        var match = string.match(pseudo_regex);

        if (string.split(':').length > 2) warn("Library does not support multiple pseudo events");

        return {
            name : match[1],
            pseudo : match[2],
            args : match[3]
        };
    }

    /**
     * proccesses an event type, returning a valid data object from that name
     * @method processType
     * @static
     * @private
     *
     * @param {string} type
     *
     * @return {Object} data
     */
    function processType(type){
        return getPseudo(removeOn(type));
    }

    /**
     * cross-browser function to create event object for fire method
     *
     * Created object will always have following properties:
     *  - dispatcher: a reference to dispatching object (since we can't use 'this')
     *  - args: arguments passed alongside the event
     *  - object_event: a flag set to true to easily check if this is an object event or a normal DOM event.
     *
     * @method Events.createEvent
     * @static
     * @private
     *
     * @param {string} type
     * @param {object} dispatcher
     * @param {mixed} args
     *
     * @return event object
     */
    function createEvent(type, dis, args){
        var ev;

        if (compat){
            ev = document.createEvent('UIEvents');
            ev.initUIEvent(type, false, false, window, 1);
        }else{
            ev = {};
        }

        ev.dispatcher = dis;
        ev.args = args;
        ev.object_event = true;

        return ev;
    }



    /**
     * Events Provider.
     *
     * Can function either as a standalone or a Mixin
     *
     * @class Events
     * @constructor
     *
     * @param {Element} el element to use as event target. Optional
     */
    Events = function Events(el){
        var $this = this;

        if (!compat){
            this.$events = {};
        }else{
            this.$event_element = el || document.createElement('events');
        }

        this.$latched = {};
        this.$once    = {};

        this.addEvent = addEvent;
        this.addEvents = addEvents;
        this.fireEvent = fireEvent;
        this.removeEvent = removeEvent;
        this.addEventOnce = addEventOnce;
        this.fireLatchedEvent = fireLatchedEvent;

        //since this code removes the reference to the events provider,
        //we want to make sure it runs after the rest of the loop is done.
        this.addEvent('destroy:delay(0)',function(){
            var names = "$event_element $latched $events $once addEvent removeEvent addEventOnce fireLatchedEvent".split(' '),
                i, name;

            for (i=0; name = names[i]; i++) $this[name] = null;

            this.$events_destroyed = true;
        });
    };

    //In case someone want to use these
    Events.removeOn = removeOn;
    Events.getPseudos = getPseudo;
    Events.processType = processType;
    Events.createEvent = createEvent;
    Events.strict = false;

    /*
     * Events.Pesudoes allows you to add pseudo behaviors
     *
     * Each object in the collection can hold both addEvent and fireEvent Methods
     *
     * The addEvent method will be fired *instead* of the normal behavior, and will be passed
     * the event type and fn
     *
     * The fireEvent method will be fired *after* the fireEvent method, and will be passed
     * the event name and the event object created
     *
     * Look at examples to see how it can be used
     *
     * @property Events.Pseudoes
     * @type {object}
     * @static
     */
    Events.Pseudoes = {
        once : {
            addEvent : function(type,fn){
                return this.addEventOnce(type, fn);
            }
        },

        latched : {
            fireEvent : function(type, args){
                return this.fireLatchedEvent(type,args);
            }
        },

        times : {
            addEvent : function(type, fn, ammount){
                var count = 0, $this = this;

                this.addEvent(type, function times(){
                    fn.apply(null, arguments);
                    count+=1;
                    if (count == ammount) $this.removeEvent(type,times);
                });
            }
        },

        delay : {
            addEvent : function(type, fn, delay){
                this.addEvent(type, function(){
                    setTimeout(fn,delay);
                });
            },
            fireEvent : function(type, args, delay){
                var $this = this;
                setTimeout(function(){
                    $this.fireEvent(type, args);
                }, delay);
            }
        }
    };

    //========================
    // cross-browser utilities
    //========================

    function register(obj, type, fn){
        if (compat){
            obj.$event_element.addEventListener(type,fn,false);
        }else{
            if (!obj.$events[type]) obj.$events[type] = [fn];
            else if (indexOf(obj.$events[type],fn)==-1){
                obj.$events[type].push(fn);
            }
        }
    }


    function dispatch(obj,type, ev){
        var i, fn;

        if (compat){
            obj.$event_element.dispatchEvent(ev);
        }else{
            if (!obj.$events[type]) return;

            for (i=0; fn = obj.$events[type][i]; i++){
                fn.apply(null,[ev]);
            }
        }
    }

    function remove(obj, type, fn){
        var index;

        if (compat){
            obj.$event_element.removeEventListener(type,fn,false);
        }else{
            if (!obj.$events[type]) return;

            index = indexOf(obj.$events[type],fn);

            if (index <0) return;

            obj.$events[type].splice(index,1);
        }
    }

    //=======================
    // Function Declarations
    //=======================


    /**
     * Adds an event
     *
     * @method addEvent
     *
     * @param {String}    the event type
     * @param {Function}  a function to add
     *
     * @chainable
     */
    addEvent = function addEvent(type,fn){
        if (this.$events_destroyed) return this;

        var data = processType(type),
            pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].addEvent,
            args = this.$latched[data.name] && this.$latched[data.name].args,
            ev;

        if (pseudo_fn){
            return pseudo_fn.apply(this,[data.name,fn,data.args]);
        }

        register(this,data.name, fn);

        if (this.$latched && this.$latched[data.name]){
            ev = createEvent(data.name, this, args);
            fn.apply(null,[ev]);
        }

        return this;
     };

    /**
     * Helper to add multiple events at once
     *
     * @method addEvents
     *
     * @param {Object} literal object of event types => callbacks
     *
     * @chainable
     */
    addEvents = function addEvents(events){
        if (this.$events_destroyed) return this;
        var type;

        for (type in events) if (events.hasOwnProperty(type)){
            this.addEvent(type, events[type]);
        }

        return this;
    };

    /**
     * dispatches an event
     *
     * @method fireEvent
     *
     * @param {String} event type
     * @param {Mixed}  arguments to pass with the event
     *
     * @chainable
     */
    fireEvent = function fireEvent(type, args){
        if (this.$events_destroyed) return this;
        var data = processType(type),
            pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].fireEvent,
            ev, fn,
            once_arr,
            temp_arr;

        if (pseudo_fn){
            return pseudo_fn.call(this,data.name,args);
        }

        //in case one of the callbacks will try and add another once event,
        //we keep a reference of the once stack, and then empty it
        once_arr = this.$once[data.name];
        this.$once[data.name] = null;

        ev = createEvent(data.name, this, args);

        dispatch(this,data.name,ev);

        if (!once_arr) return this;

        while (fn = once_arr.pop()){
            this.removeEvent(data.name, fn, true);
        }

        return this;
    };

    /**
     * removes a function from an event
     *
     * @method removeEvent
     *
     * @param {String}   event type
     * @param {Function} function to remove from stack
     *
     * @chainable
     */
    removeEvent = function removeEvent(type, fn,no_once){
        if (this.$events_destroyed) return this;
        var data = processType(type),
            index;

        remove(this,data.name, fn);

        if (!no_once && this.$once[data.name] && (index = indexOf(this.$once[data.name],fn))>-1){
            this.$once[data.name].splice(index,1);
        }

        return this;
    };

    /**
     * Adds an event for one execution, then removes it
     *
     * @method addEventOnce
     *
     * @param {String}    the event type
     * @param {Function}  a function to add
     *
     * @chainable
     */
    addEventOnce = function addEventOnce(type, fn){
        if (this.$events_destroyed) return this;
        var $this = this,
            data = processType(type);

        if (!this.$once[data.name]) this.$once[data.name] = [];
        if (indexOf(this.$once[data.name],fn) == -1){
            this.$once[data.name].push(fn);
        }

        return this.addEvent(data.name, fn);
    };

    /**
     * Fires a latched event
     *
     * @method fireLatchedEvent
     *
     * @param {String} the event type
     * @param {Mixed}  arguments to pass with the event
     *
     * @chainable
     */
    fireLatchedEvent = function fireLatchedEvent(type, args){
        if (this.$events_destroyed) return this;
        if (!this.$latched) this.$latched = {};

        this.$latched[type] = {args : args};
        this.fireEvent(type,args);

        return this;
    };     

    //expose Mixin to provided namespace
    return Events;
}));

