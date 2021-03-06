Bromine
=======
Bromine is a tool for running UI tests in the browser. It provides a simple-to-use flow control mechanism, as well as utilities for executing DOM events.

*Bromine was designed to be event based by nature, and relies heavily on [Events.js](https://github.com/arieh/Events), its syntax and its methods for passing event arguments*
##Usage

First - code example:


```javascript
    var tester = new Bromine.Tester();

    var test = tester.registerTest({
        init : function(){
            this.handle = document.querySelector('handle');
            this.target = document.querySelecrot('target');
        },
        destroy : function(){
            this.handle = null;    
        },
        tests : [
            function(){
                //in this example, the click will trigger a transition, so we have
                //to wait until it's done
                Bromine.fireEventWithDelay(this.handle, 'click', this.next);    
            },
            function(){
                if (target.classList.contains('hidden')){
                    this.fail('Target is not visible');    
                }else{
                    this.done();    
                }
            }
        ],
        //first method to register events
        onStart : function(){
            console.log('starting test suite');    
        }
    });

    //second method of registering events
    test.addEvent('fail', function(e){
        console.log('fail');    
    });

    tester.run();
```

###Explanation

Bromine is composed of 3 basic components:

1. `Bromine.Test` - A test suit, which manages a stack of steps to execute
2. `Bromine.Tester` - A test runner
3. `Bromine.Reporter` - A simple Reporter object for you to extend
4. Event dispatching utilities, such as `Bromine.fireEvent` and `Bromine.fireEventWithDelay`.

In the example above, we start by creating a Test-runner. We then register a Test suit on top of it. 
Inside the test suite, we use `fireEventWithDelay` to execute a 'click' event, and wait before executing the next function in the stack (default is 500ms). The wait is becuase many times we want to wait for a transition or an effect to finish running.

## Bromine.Test
The main method for creating Test suites is by using Bromine.Tester#registerTest. 
Possible parameters for the Test constructor are:

* `init` :  a function to run when the test is created
* `destroy` : a function to run when the test is done
* `description` : some textual description of the test
* `depend` : a test name that if fails, will prevent this suit from running
* `tests` : the actual test stack for this suit
* `fail\_timeout` : how long to wait before reporting a fail (default is 10s). If 0, will not set timeout.

In addition, each test fires the following events:
* start : will fire just before the test suit starts running
* done  : will fire when test suit finishes successfuly. 
* fail  : will fire when test suit fails

Each function in the test stack has the following methods at it's disposal:
* `log(obj)` - logs a result into the results stack
* `done` - finished the test successfully
* `fail(msg)` - fails the test

In addition, each function has access to 3 methods to contol the flow of the test - `prev`, `current`, and `next`. These can be called and passed around.

##Bromine.Tester
The test runner is used to register suites, manage their dependencies, and execute them. It has the following methods:

* `registerTest(name, options)`
* `registerReporter(reporter)`
* `run()`
* `reset()`

And the following events:

* testStart
* testDone
* testFail
* done

The first 3 pass as arguments the test name and the test instance:
 
```javascript
    tester.addEvent('testDone', function(e){
        console.log('test ' + e.name +'passed', e.test.results);   
    });
```

##Bromine.Reporter
The framework supplies a simple reporter for you to use. The reporter can either be extended, or you can override it's callbacks.

Usage:

```javascript
    var reporter = new Bromine.Reporter;

    reporter.testStart = function(name, test){};
    reporter.testDone  = function(name, results, test){};
    reporter.testFail  = function(name, results, test){};
    reporter.done = function(results){};

    tester.registerReporter(reporter);
```

##Event Dispatching
Right now Bromine supplies 2 simple methods for dispatching events on elements:

1. `Bromine.fireEvent(element, type)` - will fire a DOM eveny of `type` on `element`
2. `Bromine.fireEventWithDelay(element, type, callback [,delay])` - will fire a DOM event of `type` on `element`, then wait `delay`ms (default is 500) before dispatching `callback`. This is useful when you need to wait for a transition or effect to end before next step.

### Complex DOM Events
In case you need special event details (such as clientX or e.keyCode), Bromine supplies 2 helper methods:

#### Bromine.fireMouseEvent(element, type, params)

Parameters can be:
x, y, details, button, ctrl, alt, shift, meta, relatedTarget   

#### Bromine.fireKeyboardEvent(element, type, params)

Parameters can be:
ctrl, alt, shift, meta, key, charCode

*Note - these methods are not tested on IE, so I cannot gaurentee they will work on IE < 9 (IE9+ will work fine)*
