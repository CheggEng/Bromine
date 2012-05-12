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
            console.log('Test Runner Done',e.args.results);
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

