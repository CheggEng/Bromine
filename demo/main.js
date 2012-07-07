//FX init 
(function() {
    var acord = new Fx.Accordion($('acord'), '#acord h2', '#acord p'),
        current = $$('.current');

    acord.addEvent('active', function(t, e) {
        current.removeClass('current');
        current = t;
        t.addClass('current');
    });
})();

(function(){
    var sort = new Sortables($('sort'),{
        clone: function(){
            var li = document.createElement('li');
            li.className = 'hidden';
            return li;
        },
        opacity:0.8,
        onStart: function(el){
            el.addClass('current');                
        },
        onComplete : function(el){
            el.removeClass('current');   
        }
    });
})();     

var Tester = new Bromine.Tester(),
    reporter = new Bromine.Reporter;

reporter.testStart = function(name,test){
    console.log('Test '+name+ ' Started');
};

reporter.testDone = function(name,test,results){
    console.log('Test '+name+' Ended');
    for (var i=0, res;res = results[i]; i++){
        console.log(res.meg,res.success);    
    }
};

Tester.registerReporter(reporter);

Tester.registerTest("Accordion Test",{
    description : "Toggle accordion handles",
    init : function(){
        this.handles = document.querySelectorAll('#acord h2');    
        this.index = 0;
    },
    destroy : function(){
        this.handles = null;    
    },
    tests : [
        function(){
            this.log({
                msg : 'First handle should be selected',
                success : this.handles[0].className == 'current'
            });    

            Bromine.fireEvent(this.handles[++this.index],'click');

            setTimeout(this.next, 1000);
        },
        function(){
            this.log({
                msg : "Previous handle should be cleared (section "+this.index+")",
                success : this.handles[this.index-1].className !='current'
            });

            this.log({
                msg : "Current handle should be opened (section "+(this.index+1)+")",
                success : this.handles[this.index].className == 'current'
            });

            if (this.index == 2){
                return this.done();    
            }

            Bromine.fireEvent(this.handles[++this.index],'click');
            setTimeout(this.current, 1000);
        }
    ]
});


document.getElementById('start').addEventListener('click',function(){Tester.run();},false);
