'use strict';

var qunit = require("qunit");

qunit.run({
	deps : [{
		path : "node_modules/is-promise/index.js",
		namespace : 'isPromise'
	}],
    code: {
    	path : "tiny-deferred.js",
    	namespace : 'deferred'
    },
    tests: "test/test.js"
});