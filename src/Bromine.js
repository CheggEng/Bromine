/**!Copyright 2012 Chegg inc

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
        var utils = require('Bromine/utils');

        module.exports = factory(Events);

    } else if (typeof define === 'function' && define.amd) {
        define(['Bromine/utils'], function (utils) {
            return factory(utils);
        });
    } else {
        root.Bromine = factory(root.utils);
    }
}(this, function (utils) {
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
     *  @param {int}      [options.fail_timeout=10s] how much time to wait for tests to finish before reporting failure
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
     *  @param {array} args.results the results of the test
     */ 
    /**
     * fires if and when the test has finished running but failed
     * @event fail
     * @param {object} args
     *  @param {array} args.results the results of the test
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

    Bromine = window.Bromine || {};

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

            if (params.delta) {
                evt.wheelDelta = params.delta;
            }

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

            if (params.delta) {
                evt.wheelDelta = params.delta;
            }

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

    return Bromine;
}));
