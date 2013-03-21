var http = require('http');
var util = require('util');
var dns = require('dns');

// ugly hack
oldLookup = dns.lookup;

dns.lookup = function forcedLookup (domain, callback) {
    return oldLookup(domain, 4, callback)
};

// end ugly hack

//http.globalAgent.maxSockets = 1000;

var HOST = 'sfloadtest2.loudcontrol.de';
//var HOST = 'loadtest.devcctrl.com'

var SESSION_PER_SECOND = 40;
var REQS_PER_SESSION = 100;
var SECONDS = 60;

function now () {
    return (new Date()).getTime()/1000
}

function stage (agent, reqs, callback) {
    var running = 0;
    for (var i = 0; i < reqs; i++) {
	running++;
	http.get({'host': HOST,
		  'headers': {'Connection': 'keep-alive'},
		  'path': '/foo',
		  'agent': agent},
		 function (resp) {
		     resp.on('data', function (_) {});
		     resp.on('end', function () {
			 running--;
			 if (running == 0) {
			     callback();
			 } else if (running < 0) {
			     process.stderr.write("running shouldn't be: " + running + '\n');
			 }
		     });
		 });
    }
}


function session (shouldStart) {
    var agent = new http.Agent({'maxSockets': 1});
    var start = now();
    //process.stderr.write("" + (start - shouldStart) + '\n');
    stage(agent, 1, function () {
	stage(agent, 100, function () {
	    var end = now();
	    var duration = end - start;
	    process.stdout.write("" + (start - test_start) + " " + duration + 
				 " " + duration + " 0\n");
	});
    });
}

test_start = now()

for (var i = 0; i < SESSION_PER_SECOND * SECONDS; i++) {
    (function () {
	var wait =  Math.random() * SECONDS;
	var shouldStart = test_start + wait;
	setTimeout(function () {
	    session(shouldStart);
	},
		   wait * 1000);
    })();
}
