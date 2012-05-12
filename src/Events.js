!function(){
    var compat = 'createEvent' in document,
        pseudo_regex = /([^:]+)(?:\:([^(]*)(?:\((.*)\))?)?/,
        addEvent, addEvents, fireEvent, removeEvent, addEventOnce, Events, fireLatchedEvent;

    //=================
    //    UTILITIES
    //=================

    //utility function for cross-browser
    function indexOf(arr, target){
        var i, item;
        if (arr.indexOf) return arr.indexOf(target);

        for(i=0; item = arr[i]; i++) if (item == target) return i;

        return -1;
    }

    //removes the on* prefix from event names
    function removeOn(string){
        return string.replace(/^on([A-Z])/, function(full, first){
            return first.toLowerCase();
        });
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

    //returns a structured data object about a type's pseudo-events
    function getPseudo(string){
        var match = string.match(pseudo_regex);

        if (string.split(':').length > 2) warn("Library does not support multiple pseudo events");

        return {
            name : match[1],
            pseudo : match[2],
            args : match[3]
        };
    }

    //returns an object with needed type about event type
    function processType(type){
        return getPseudo(removeOn(type));
    }

    /*
     * cross-browser function to create event object for fire method
     *
     * Created object will always have following properties:
     *  - dispatcher: a reference to dispatching object (since we can't use 'this')
     *  - args: arguments passed alongside the event
     *  - object_event: a flag set to true to easily check if this is an object event or a normal DOM event.
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
     * @param {Element} el element to use as event target. Optional
     *
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

        /**
         * Adds an event
         *
         * @param {String}    the event type
         * @param {Function}  a function to add
         *
         * @return this
         */
        this.addEvent = addEvent;

        /**
         * Helper to add multiple events at once
         *
         * @param {Object} literal object of event types => callbacks
         *
         * @return this
         */
        this.addEvents = addEvents;

        /**
         * dispatches an event
         *
         * @param {String} event type
         * @param {Mixed}  arguments to pass with the event
         *
         * @return this
         */
        this.fireEvent = fireEvent;

        /**
         * removes a function from an event
         *
         * @param {String}   event type
         * @param {Function} function to remove from stack
         *
         * @return this
         */
        this.removeEvent = removeEvent;

        /**
         * Adds an event for one execution, then removes it
         *
         * @param {String}    the event type
         * @param {Function}  a function to add
         *
         * @return this
         */
        this.addEventOnce = addEventOnce;

        /**
         * Fires a latched event
         *
         * @param {String} the event type
         * @param {Mixed}  arguments to pass with the event
         *
         * @return this
         */
        this.fireLatchedEvent = fireLatchedEvent;

        //since this code removes the reference to the events provider,
        //we want to make sure it runs after the rest of the loop is done.
        this.addEvent('destroy:delay(0)',function(){
            var names = "$event_element $latched $events $once addEvent removeEvent addEventOnce fireLatchedEvent".split(' '),
                i, name;

            for (i=0; name = names[i]; i++) $this[name] = null;
        });
    };

    //In case someone want to use these
    Events.removeOn = removeOn;
    Events.getPseudos = getPseudo;
    Events.processType = processType;
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

    //expose Mixin to provided namespace
    this.Events = Events;

    //========================
    // cross-browser utilities
    //========================

    function register(obj, type, fn){
        if (compat){
            obj.$event_element.addEventListener(type,fn,false);
        }else{
            if (!obj.$events[type]) obj.$events[type] = [fn];
            else if (obj.$events[type].indexOf(fn)==-1){
                obj.$evetns[type].push(fn);
            }
        }
    }


    function dispatch(obj,type, ev){
        var i, fn;

        if (compat){
            obj.$event_element.dispatchEvent(ev);
        }else{
            for (i=0; fn = obj.$events[type]; i++){
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

    addEvent = function addEvent(type,fn){
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

    addEvents = function addEvents(events){
        var type;
        
        for (type in events) if (events.hasOwnProperty(type)){
            this.addEvent(type, events[type]);    
        }

        return this;
    };

    fireEvent = function fireEvent(type, args){
        var data = processType(type),
            pseudo_fn = Events.Pseudoes[data.pseudo] && Events.Pseudoes[data.pseudo].fireEvent,
            ev, fn;

        if (pseudo_fn){
            return pseudo_fn.call(this,data.name,args);
        }

        ev = createEvent(data.name, this, args);

        dispatch(this,data.name,ev);

        if (!this.$once[data.name]) return this;

        while (fn = this.$once[data.name].pop()){
            this.removeEvent(data.name, fn);
        }

        return this;
    };

    removeEvent = function removeEvent(type, fn){
        var data = processType(type),
            index;

        remove(this,data.name, fn);

        if (this.$once[data.name] && (index = this.$once[data.name].indexOf(fn))>-1){
            this.$once[data.name].splice(index,1);
        }

        return this;
    };

    addEventOnce = function addEventOnce(type, fn){
        var $this = this,
            data = processType(type);

        if (!this.$once[data.name]) this.$once[data.name] = [];
        if (this.$once[data.name].indexOf(fn) == -1){
            this.$once[data.name].push(fn);
        } 

        return this.addEvent(data.name, fn);
    };

    fireLatchedEvent = function fireLatchedEvent(type, args){
        if (!this.$latched) this.$latched = {};

        this.$latched[type] = {args : args};
        this.fireEvent(type,args);

        return this;
    };


}.call(this);

