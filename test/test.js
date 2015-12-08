'use strict';

QUnit.module('tiny-deferred', {
	setup : function() {
	}
})

test("Is Promise test", function () {
    var value = "hello";
    var defer = deferred();

    ok(isPromise(defer.promise), "Promise");
});