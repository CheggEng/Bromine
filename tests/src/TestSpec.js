describe("Test", function(){
    it ("Should run tests by order", function(){
        var i = 0, test;

        test = new Bromine.Test({
            tests : [
                function(){
                    expect(i++).toEqual(0);
                    this.next();
                },
                function(){
                    expect(i++).toEqual(1);
                    this.next();
                        
                },
                function(){
                    expect(i++).toEqual(2);    
                }
            ]   
        });

        test.run();
        expect(i).toEqual(3);
    });

    it ("Should be able to pass iterations by reference", function(){
        var i = 0, test;

        test = new Bromine.Test({
            tests : [
                function(){
                    i+=1;
                    expect(i).toEqual(1);
                    setTimeout(this.next, 100);
                },
                function(){
                    i += 2;
                    expect(i).toEqual(3);
                    setTimeout(this.next, 100);
                },
                function(){
                    i += 3;
                    expect(i).toEqual(6);    
                }
            ]   
        });

        test.run();

        waitsFor(function(){ return i==6; }, "tests should have run async", 500);
        
    });

    it ("Should allow complex navigation through stack", function(){
        var stack = [], test, i=0, done;

        test = new Bromine.Test({
            onDone : function(){
                expect(stack).toEqual(['a','a','b','a','a','b','b','c'], "");
                done = true;
            },
            tests : [
                function(){
                    stack.push('a');
                    i+=1;

                    if (i<2 || i == 4) this.current();
                    else this.next();
                },
                function(){
                    stack.push('b');
                    i+=1;

                    if (i<4) this.prev();
                    else if(i<=6) this.current();
                    else this.next();
                },
                function(){
                    stack.push('c');
                    this.done();
                }
            ]    
        });

        test.run();

        waitsFor(function(){ return done; }, "tests should have run through", 500);
    });
    
    it ("Should fire events and call helper methods properly", function(){
        var results={
                init : 0,
                start : 0,
                done : 0,
                fail : 0,
                destroy : 0
            }, 
            opts;

        function result(state){
            results[state]++;
        }

        opts = {
            init : result.bind(null,'init'),
            onStart : result.bind(null,'start'),
            onDone : result.bind(null,'done'),
            onFail : result.bind(null,'fail'),
            destroy : result.bind(null,'destroy')
        };

        opts.tests = [function(){this.done();}]
        new Bromine.Test(opts).run();

        opts.tests = [function(){this.fail();}]
        new Bromine.Test(opts).run();

        expect(results.init).toEqual(2, "init callback should have been called twice");
        expect(results.start).toEqual(2, "start event should have been fired twice");
        expect(results.done).toEqual(1, "done event should have been fired once");
        expect(results.fail).toEqual(1, "fail event should have been fired twice");
        expect(results.destroy).toEqual(2, "destroy callback should have been called twice");
    });
        
});
