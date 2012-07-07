!function(){
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
    function indexOf(arr, target){
        var i, item;
        if (arr.indexOf) return arr.indexOf(target);

        for(i=0; item = arr[i]; i++) if (item == target) return i;

        return -1;
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
        var data = processType(type),
            index;

        remove(this,data.name, fn);

        if (!no_once && this.$once[data.name] && (index = this.$once[data.name].indexOf(fn))>-1){
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
        var $this = this,
            data = processType(type);

        if (!this.$once[data.name]) this.$once[data.name] = [];
        if (this.$once[data.name].indexOf(fn) == -1){
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
        if (!this.$latched) this.$latched = {};

        this.$latched[type] = {args : args};
        this.fireEvent(type,args);

        return this;
    };     

    //expose Mixin to provided namespace
    this.Events = Events;     
}.call(this);

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
!function(ns, utils){
    /**
     * @module Bromine
     */
    var dom_events = 'addEventListener' in document;
    /**
     * A Test Instance
     * @class Bromine.Test
     * @uses Events
     * @uses Options
     * @constructor
     *
     * @param {object} options
     *  @param {function} [options.init]   a function to execute before tests start 
     *  @param {array}    [options.tests]  a queue of functions to run 
     *  @param {string}   [options.depend] a test dependancy
     *  @param {int}      [options.fail_timeout=10 seconds] how much time to wait for tests to finish before reporting failure
     */
    function Test(opts){
        utils.Options.call(this);
        utils.Events.call(this);

        this.setOptions(opts);

        this.stack = this.options.tests;
        this.description = this.options.description;

        /**
         * holds a stack of reported results
         * @property results
         * @type {Array}
         */
        this.results = [];

        this.next = this.next.bind(this);
        this.current = this.current.bind(this);
        this.prev = this.prev.bind(this);

        this.test_index = 0;
        this.depend = opts.depend;

        opts.init && opts.init.call(this);
    } 

    /**
     * fires when test starts running. Latched
     * @event start
     */
    /**
     * fires if and when the test has finished running successfuly
     * @event done
     * @param {object} args
     *  @param {array} results the results of the test
     */ 
    /**
     * fires if and when the test has finished running but failed
     * @event fail
     * @param {object} args
     *  @param {array} results the results of the test
     */  
    /**
     * fires on object destruction
     * @event destory
     */        

    Test.prototype = {
        constructor : Test,
        defaultOptions : {
            init : function(){},
            destroy : function(){},
            tests : [],
            depend : '',
            fail_timeout : 10 * 1000
        },

        /**
         * runs the tests
         * @method run
         */
        run : function(){
            this.fireEvent('start:latched');

            this.next();
        },

        /**
         * logs a result to the test
         * @method log
         * @param {object} params
         */
        log : function(params){
            this.results.push(params);
        },

        /**
         * Called when tests are done
         * @method done
         *  @param {bool} state       whether test passed or failed
         *  @param {String} [message] only used on failure
         */
        done : function(state, msg){
            this.tests_done = true;

            clearTimeout(this.timeout_handle);

            if (state === false){
                return this.fail(msg);
            }else{
                this.fireEvent('done:latched',{
                    results : this.results
                });
            }

            this.destroy();
        },
        /**
         * signifies a test failure. Will stop any more steps from running
         * @method {fail}
         * @param {string} message
         */
        fail : function(msg){
            this.tests_done = true;
            clearTimeout(this.timeout_handle);

            this.log({
                success : false,
                msg : msg
            });

            this.fireEvent('fail',{
                results : this.results
            });

            this.destroy();
        },

        destroy : function(){
            this.fireEvent('destroy');
            this.options.destroy();
        },

        setTimeout : function(){ 
            var $this = this;

            if (this.options.fail_timeout){
                clearTimeout(this.timeout_handle);

                this.timeout_handle = setTimeout(function(){
                    $this.fail("Test timed out");    
                }, this.options.fail_timeout);
            } 
        },

        /**
         * calls the next function in the stack
         * @method next
         */
        next : function(){                          
            var fn = this.stack[this.test_index++];

            if (this.tests_done) return null;

            this.setTimeout();

            return fn && fn.apply(this, arguments);
        },
        
        /**
         * calls the current function in the stack
         * @method current
         */
        current : function(){
            var fn = this.test_index === 0 ? this.stack[this.test_index] : this.stack[this.test_index -1];
            if (this.tests_done) return null;
            this.setTimeout();
            return fn && fn.apply(this, arguments);
        },

        /**
         * calls the previous function in the stack
         * @method prev
         */
        prev : function(){
            var fn;
            if (this.tests_done) return null;

            this.test_index-=1;
            if (this.test_index < 1) this.test_index = 1;

            fn = this.stack[this.test_index-1];
            this.setTimeout();

            return fn && fn.apply(this, arguments);
        }
    };

    /**
     *  Test Runner
     *  Takes care of registering tests, running them and reporting their results
     *  @class Bromine.Tester
     *  @constructor
     *  @uses Events
     *  @uses Options 
     *  @uses Bind
     *
     *  @param {object} [options]
     *      @param {array} [options.exclude] a list of test names to skip
     *      @param {array} [options.run_only] if provided, will only run tests that are in it
     */
    function Tester(opts){
        utils.Bind.call(this);
        utils.Options.call(this);
        utils.Events.call(this);

        this.setOptions(opts);

        this.tests = {};
        this.depends = [];
        this.stack = [];
        this.results = {};
    }    
    /**
     * fires when a test starts running
     * @event start
     * @param args
     *  @param {string} args.name
     *  @param {Bromine.Test} args.test
     */ 
    /**
     * fires when all tests are done
     * @event done
     * @param args
     *  @param {array} args.results
     */    
    /**
     * fires when a test is done successfuly
     * @event testDone
     * @param args
     *  @param {string} args.name
     *  @param {Bromine.Test} args.test   
     *  @param {Array} args.results
     */      
    /**
     * fires when a test is done but failed
     * @event testFAil
     * @param args
     *  @param {string} args.name
     *  @param {Bromine.Test} args.test   
     *  @param {Array} args.results
     */  
    Tester.prototype = {
        constructor : Tester,
        defaultOptions : {
            exclude : [],
            run_only : []
        },
        bind : ['testDone','testFailed'],
        /**
         * register a test
         * @method registerTest
         *  @param {string} name
         *  @param {Object|Bromine.Test} paramaters for Test constructor or a Test instance
         */
        registerTest : function(name, params){
            var test = this.tests[name] = params instanceof Test ? params : new Test(params),
                $this = this;

            test.addEvents({
                'start': function(e){
                    $this.fireEvent('testStart',{name:e.dispatcher.name, test: e.dispatcher});
                },
                'done' : this.bound.testDone,
                'fail' : this.bound.testFailed
            });

            test.name = name;

            if (!this.depends[name]){
                this.depends[name] = [];
            }

            if (params.depend){
                if (!this.depends[params.depend]) this.depends[params.depend] = [];
                this.depends[params.depend].push(name);
            }else{
                this.stack.push(name);
            }
        },
        /**
         * returns the tests stack
         * @method getTests
         * @return {array} tests
         */
        getTests : function(){
            return this.stack;
        },

        /**
         * starts running tests
         * @method run
         */
        run : function(){
            this.original_stack = JSON.stringify(this.stack);
            this.stop = false;
            this.next();
        },

        /** 
         * resets test runner
         * @method reset
         */
        reset : function(){
            this.stop = true;
            this.stack = JSON.parse(this.original_stack);
        },

        next : function(){
            var name = this.stack.shift(),
                test = this.tests[name];

            if (this.stop) return;

            if (!name){
                this.fireEvent('done', {results : this.results});
                return;
            }

            if (this.options.exclude.indexOf(name) > -1){
                return this.next();
            }

            if (this.options.run_only.length && this.options.run_only.indexOf(name) == -1){
                return this.next();
            }

            this.tests[name].run();
        },   

        testDone : function(e){
            var stack = this.depends[e.dispatcher.name],
                i, name;

            this.fireEvent('testDone',{name : e.dispatcher.name, test: e.dispatcher, results : e.args.results});

            for (i=0; name = stack[i]; i++){
                if (!name) continue;
                this.stack.push(name);
            }

            this.results[e.dispatcher.name] = e.dispatcher.results;

            this.next();
        },

        testFailed : function(e){
            var stack = this.depends[e.dispatcher.name],
                i, name;

            this.fireEvent('testFail',{name : e.dispatcher.name, test: e.dispatcher, results : e.args.results});

            for (i=0; name = stack[i]; i++){
                this.tests[name].done(false, "dependancy failed: "+name);
            }

            this.results[e.dispatcher.name] = e.dispatcher.results;
            this.next();
        },
        /**
         * registers a Test reporter
         * @method registerReporter
         * @param Bromine.Reporter
         */
        registerReporter : function(r){
            var target = dom_events ? r : r.handleEvent;

            this.addEvents({
                testStart : target,
                testDone  : target,
                testFail  : target,
                done      : target
            });
        }
    };


    function getIEEvent(){
        var evt = document.createEventObject();
        return evt;
    }

    /**
     * @class Bromine
     */

    /**
     * Dispatches a DOM event on a given element
     * @method fireEvent
     * @static
     *
     * @param {Element} el
     * @param {String}  type
     */
    Bromine.fireEvent = function fireEvent(element, event) {
        var evt;

        if (document.createEventObject) {
            // dispatch for IE
            evt = getIEEvent();
            element.fireEvent('on' + event, evt); 
        } else {
            // dispatch for firefox + others
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, true, true); // event type,bubbling,cancelable
            element.dispatchEvent(evt);
        }
    };

    /**
     * Fires a mouse event on element
     *
     * Additional parameters can be:
     *  
     *  x, y, details, button, ctrl, alt, shift, meta, relatedTarget
     *
     *  if no x/y supplied, will use element position
     *
     * @method fireMouseEvent
     * @static
     * @param {element} el
     * @param {string}  type
     * @param {object}  params
     */
    Bromine.fireMouseEvent = function(element, type, params){
        if (!params) params = {};
        var evt,
            position = utils.calculateOffsets(element),
            clicks = 'details' in params ? params.details : 1,
            x = 'x' in params ? params.x : position.left,
            y = 'y' in params ? params.y : position.top,
            button = 'button' in params ? params.button : 0;

        if (document.createEvent){
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(type, true, true, window, 
                                 clicks, x, y, x, y, 
                                 params.ctrl, params.alt, params.shift, params.meta, 
                                 button, params.relatedTarget);
            element.dispatchEvent(evt);
        }else{
            evt = getIEEvent(); 
            evt.screenX = x;
            evt.screenY = y;    
            evt.clientX = x;
            evt.clientY = y;
            evt.ctrlKey = params.ctrl;
            evt.altKey = params.alt;
            evt.shiftKey = params.shift;
            evt.metaKey = params.meta;
            evt.button = button;
            evt.relatedTarget = params.relatedTarget;
            evt.detail = clicks;

            element.fireEvent('on'+type, evt);
        }
    }; 

    /**
     * Fires a keyboard event on element
     *
     * Additional parameters can be:
     *  
     *  ctrl, alt, shift, meta, key, charCode
     *
     * @method fireKeyboardEvent
     * @static
     * @param {element} el
     * @param {string}  type
     * @param {object}  params    
     */    
    Bromine.fireKeyboardEvent = function(element, type, params){
        var evt;
        if (!params) params = {};

        if (document.createEvent){
            evt = document.createEvent('KeyboardEvent');
            evt.initKeyEvent(type, true, true, null, params.ctrl, params.alt, params.shift, params.meta, 
                        params.key, params.charCode);
            element.dispatchEvent(evt);
        }else{
            evt = getIEEvent();   
            evt.ctrlKey = params.ctrl;
            evt.altKey = params.alt;
            evt.shiftKey = params.shift;
            evt.metaKey = params.meta;  
            evt.keyCode = params.key;
            evt.charCode = params.charCode;

            element.fireEvent('on'+type, evt);
        }
        
    };

    /**
     * Dispatches a DOM event on an element, then dispatches a callback after given delay
     * @method fireEventWithDelay
     * @static
     *
     * @param {Element}  el
     * @param {String}   type
     * @param {Function} callback
     * @param {int}      [delay=500]
     */
    Bromine.fireEventWithDelay = function fireEventWithDelay(element, event, cb, delay) {
        var timeout_delay = delay || 500;

        Bromine.fireEvent(element, event);
        window.setTimeout(cb, timeout_delay);
    };

    Bromine.Tester = Tester;
    Bromine.Test = Test;
}.apply(Bromine,[Bromine, Bromine.utils]);
!function(){

    function Reporter(){}

    Reporter.prototype = {
        constructor : Reporter,
        handleEvent : function(e){
            var fn = this[e.type];

            switch (e.type){
                case 'done':
                    fn(e.args.results);
                    break;
                case 'testStart':
                    fn(e.args.name,e.args.test);
                    break;
                default:
                    fn(e.args.name, e.args.results, e.args.test);
            }
        },
        done : function(res, test){
            console.log('Test Runner Done',[res,test]);
        },
        testStart : function(name, test){
            console.log('Test Start',[name, res]);    
        },
        testDone : function(name, res, test){
            console.log('Test Done',[name, res]);    
        },
        testFail : function(name, res, test){
            console.log('Test Fail',[name, res]);    
        }
    };

    Bromine.Reporter = Reporter;
    
}.call(Bromine);

