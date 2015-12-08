'use strict';

var qunit = require("qunit");

qunit.run({
	deps : [{
		path : "node_modules/is-promise/index.js",
		namespace : 'isPromise'
	}],
    code: "tiny-deferred.js",
    tests: "test/test.js"
});