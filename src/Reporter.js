/*!Copyright 2012 Chegg inc

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
        var Bromine = require('Bromine/Bromine');

        module.exports = factory(Bromine);

    } else if (typeof define === 'function' && define.amd) {
        define(['Bromine/Bromine'], function (Bromine) {
            return factory(Bromine);
        });
    } else {
        root.Bromine.Reporter = factory(root.Bromine);
    }
}(this, function (Bromine) {

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

    return Reporter;
    
}));

