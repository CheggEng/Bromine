!function(ns, utils){
    /**
     * A Test Instance
     *
     *  Possible options:
     *
     *      - init (function): a function to execute before tests start
     *      - tests (array): a queue of functions to run
     *      - depend (string): a test dependancy
     */
    function Test(opts){
        utils.Options.call(this);
        utils.Events.call(this);

        this.setOptions(opts);

        this.stack = this.options.tests;
        this.description = this.options.description;

        this.results = [];

        this.next = this.next.bind(this);
        this.current = this.current.bind(this);

        this.test_index = 0;
        this.depend = opts.depend;

        opts.init && opts.init.call(this);
    }

    Test.prototype = {
        constructor : Test,
        defaultOptions : {
            init : function(){},
            destroy : function(){},
            tests : [],
            depend : ''
        },

        //runs the tests
        run : function(){
            this.fireEvent('start:latched');
            this.next();
        },

        //logs results
        log : function(params){
            this.results.push(params);
        },

        /**
         * Called when tests are done
         *
         *  @param bool   state   whether test passed or failed
         *  @param String message
         *
         */
        done : function(state, msg){
            this.tests_done = true;

            if (state === false){
                return this.fail(msg);
            }else{
                this.fireEvent('done:latched');
            }

            this.destroy();
        },

        fail : function(msg){
            this.tests_done = false;

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

        next : function(){
            var fn = this.stack[this.test_index++];

            if (this.tests_done) return null;

            return fn && fn.apply(this, arguments);
        },

        current : function(){
            var fn = this.test_index === 0 ? this.stack[this.test_index] : this.stack[this.test_index -1];
            if (this.tests_done) return null;
            return fn && fn.apply(this, arguments);
        },

        prev : function(){
            var fn;
            if (this.tests_done) return null;

            this.test_index-=1;
            if (this.test_index < 1) this.test_index = 1;

            fn = this.stack[this.test_index-1];

            return fn && fn.apply(this, arguments);
        }
    };

    /**
     *  Test Runner
     *
     *  Takes care of registering tests, running them and reporting their results
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

    Tester.prototype = {
        constructor : Tester,
        defaultOptions : {
            exclude : [], //an array of tests to exclude from running
            run_only : [] //an array of tests to run exclusively
        },
        bind : ['testDone','testFailed'],
        /**
         * register a test
         *
         *  @param string name
         *  @param Object|Test paramaters for Test constructor or a Test instance
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

        //returns the test stack
        getTests : function(){
            return this.stack;
        },

        //execute test suites
        run : function(){
            this.original_stack = JSON.stringify(this.stack);
            this.stop = false;
            this.next();
        },

        //resets test runner
        reset : function(){
            this.stop = true;
            this.stack = JSON.parse(this.original_stack);
        },

        next : function(){
            var name = this.stack.shift(),
                test = this.tests[name];

            if (this.stop) return;

            if (!name){
                this.fireEvent('done');
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

            this.fireEvent('testDone',{name : e.dispatcher.name, test: e.dispatcher});

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

            this.fireEvent('testFail',{name : e.dispatcher.name, test: e.dispatcher});

            for (i=0; name = stack[i]; i++){
                this.tests[name].done(false, "dependancy failed: "+name);
            }

            this.results[e.dispatcher.name] = e.dispatcher.results;
            this.next();
        }
    };

    this.Test = Test;

    /**
     * Dispatches a DOM event on a given element
     *
     * @param Element
     * @param String 
     */
    Tester.fireEvent = function fireEvent(element, event) {
        var evt;

        if (document.createEventObject) {
            // dispatch for IE
            evt = document.createEventObject();
            return element.fireEvent('on' + event, evt);
        } else {
            // dispatch for firefox + others
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, true, true); // event type,bubbling,cancelable
            return !element.dispatchEvent(evt);
        }
    };

    /**
     * Dispatches a DOM event on an element, then dispatches a callback after given delay
     *
     * @param Element
     * @param String
     * @param Function
     * @param int       optional. Delay in ms. Default is 500ms
     */
    Tester.fireEventWithDelay = function fireEventWithDelay(element, event, cb, delay) {
        var timeout_delay = delay || 500;

        Tester.fireEvent(element, event);
        window.setTimeout(cb, timeout_delay);
    };

    this.Tester = Tester;
}.apply(Bromine,[Bromine, Bromine.utils]);
