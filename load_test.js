var http = require('http');
var util = require('util');
var dns = require('dns');

process.on('uncaughtException', function(err) {
    console.log(err);
});

// ugly hack
oldLookup = dns.lookup;

dns.lookup = function forcedLookup (domain, callback) {
    return oldLookup(domain, 4, callback);
};
// end ugly hack

//http.globalAgent.maxSockets = 1000;

if(process.argv.length <= 2) {
    process.stdout.write("host must be specified\n");
    process.exit();
}

var HOST = process.argv[2];

var SESSION_PER_SECOND = 40;
var REQS_PER_SESSION = 100;
var DURATION = 60;

if(process.argv.length > 3) {
    if(process.argv.length < 6) {
        process.stdout.write("host, session_per_second, reqs_per_session, duration ([s]) must be specified\n");
        process.exit();
    }

    SESSION_PER_SECOND = parseInt(process.argv[3]);
    REQS_PER_SESSION = parseInt(process.argv[4]);
    DURATION = parseInt(process.argv[5]);
}

function now() {
    return (new Date()).getTime() / 1000;
}

function stage(agent, reqs, callback) {
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
                    if (running === 0) {
                        callback();
                    } else if (running < 0) {
                        process.stderr.write("running shouldn't be: " + running + '\n');
                    }
                });
            });
    }
}

function session(shouldStart) {
    var agent = new http.Agent({'maxSockets': 1});
    var start = now();
    //process.stderr.write("" + (start - shouldStart) + '\n');
    stage(agent, REQS_PER_SESSION, function () {
        var end = now();
        var duration = end - start;
        process.stdout.write("" + (start - test_start) + " " + duration + " " + duration + " 0\n");
    });
}

test_start = now();

for (var i = 0; i < SESSION_PER_SECOND * DURATION; i++) {
    (function () {
        var wait =  Math.random() * DURATION;
        var shouldStart = test_start + wait;
        setTimeout(function () {
            session(shouldStart);
        },
        wait * 1000);
    })();
}
