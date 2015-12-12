'use strict';

QUnit.module('tiny-deferred', {
	setup : function() {
		return {
			x : {}
		}
	}
})

test("Is Promise test", 1, function () {
    var defer = deferred();

    ok(isPromise(defer.promise), "Promise");
});

asyncTest("Async qunit test", function () {
    setTimeout(function() {
		start();
		ok(true, "teeest");
    }, 100);
});

asyncTest("No arguments", function () {
    var defer = deferred();
    var value = 'some_value';

	defer.resolve(value)(function (res) {
		start();
		ok(res === value, "Resolve");
	});
});

asyncTest("One argument", function () {
	var x = this.x;
    var defer = deferred(x);

	ok(isPromise(defer), "Got promise");
});