'use strict';

QUnit.module('tiny-deferred', {
	setup : function() {
	}
});

test("Is Promise test", function () {
    var defer = deferred();

    ok(isPromise(defer.promise), "Promise");
});

test("No arguments", function () {
    var defer = deferred();
    var value = 'some_value';

	defer.resolve(value)(function (res) {
		ok(res === value, "Resolve");
	});
});

test("Only first resolve is taken", function () {
	var defer = deferred();

	defer.promise;
	defer.resolve(1);
	defer.resolve(2);

	ok(defer.promise.valueOf() === 1);
});

test("Promise called without arguments returns pointer to itself" , function () {
	var defer = deferred();

	equal(defer.promise, defer.promise(), 'Same promise');
});

test("Nesting", function () {
	var defer1 = deferred(),
		defer2 = deferred(),
		x = {},
		promise;

	defer1.resolve(defer2.promise);
	promise = defer1.promise.then(function(arg) {
		return [arg, 'foo'];
	});
	defer2.resolve(x);

	equal(promise.resolved, true, "Transfered");
	deepEqual(promise.value, [x, 'foo'], "Transfered value");
});

test("Resolve corner case", function () {
	var defer1 = deferred(),
		defer2 = deferred(),
		defer3 = deferred(),
		defer4 = deferred(),
		count = 0;

	defer1.promise(function () { ++count; });
	defer2.promise(function () { ++count; });
	defer3.promise(function () { ++count; });
	defer4.promise(function () { ++count; });

	defer1.resolve(defer2.promise);
	defer2.resolve(defer3.promise);
	defer3.resolve(defer4.promise);
	defer2.promise(function () { ++count; });
	defer1.promise(function () { ++count; });
	defer4.resolve({});

	equal(count, 6);
});

asyncTest("Chaining", function() {
	var defer = deferred(),
		promise = defer.promise,
		arg1 = 'arg1',
		arg2 = 'arg2',
		arg3 = 'arg3';

	promise.then(function(value) {
		var def = deferred();
		equal(value, arg1, "Arg1 passed");

		setTimeout(function() {
			def.resolve(arg2);
		}, 100);

		return def.promise;
	}).then(function(value) {
		var def = deferred();
		equal(value, arg2, "Arg2 passed");

		def.resolve(arg3);
		return def.promise;
	}).then(function(value) {
		equal(value, arg3, "Arg3 passed");
		equal(promise.value, arg1, "Arg1 saved");
		return value;
	}).then(function(value) {
		var def = deferred();
		equal(promise.value, arg1, "Does not change promise value");

		setTimeout(function() {
			def.resolve(arg1+value);
		}, 100);

		return def.promise;
	}).then(function(test) {
		start();
		equal(test, 'arg1arg3', "Does not change promise value");
	});

	defer.resolve(arg1);
});

asyncTest("Async chaining", function() {
	expect(3);

	var defer = deferred(),
		promise = defer.promise,
		arg1 = 'arg1',
		arg2 = 'arg2';

	promise.then(function(value) {
		var def = deferred();
		equal(value, arg1, "Arg1 passed");

		setTimeout(function() {
			start();
			def.resolve(arg2);
		}, 200);

		return def.promise;
	}).then(function(value) {
		equal(value, arg2, "Arg2 passed");
		return value;
	}).then(function(value) {
		equal(value, arg2, "Arg2 saved");
	});

	defer.resolve(arg1);
});

test("Call all then callbacks in order", function () {
	var defer = deferred(),
		promise = defer.promise,
		x = {},
		count = 0;

	promise(function () {
		++count;
	});

	promise(function () {
		equal(count, 1);
	});

	defer.resolve(x);
});

test("Resolve promise with other promise", function () {
	var defer1 = deferred(),
		promise1 = defer1.promise,
		x = {},
	  	defer2 = deferred(),
	  	promise2 = defer2.promise;

	promise1(function (result) {
		equal(result, x);
	});

	defer1.resolve(promise2);
	defer2.resolve(x);
});

asyncTest("Async resolve promise with other promise", function () {
	var defer1 = deferred(),
		promise1 = defer1.promise,
		x = {},
	  	defer2 = deferred(),
	  	promise2 = defer2.promise;

	promise1(function (result) {
		equal(result, x);
	});

	defer1.resolve(promise2);
	setTimeout(function() {
		start();
		defer2.resolve(x);
	}, 500);
});

asyncTest("Processing collections - map", function () {
	var text = 'Lorem Ipsum is simply dummy text of the printing';

	deferred.map(text.split(' '), function(word) {
		var defer = deferred();

		setTimeout(function() {
			defer.resolve(word.toLowerCase());
		}, 10);

		return defer.promise;
	}).then(function(result) {
		var textLowerCase = result.join(' ');

		start();
		equal(Array.isArray(result), true, "Result is an array");
		equal(textLowerCase, text.toLowerCase(), 'Words in proper order, no one is missing');
	});
});

asyncTest("Processing collections - using map with promise as value", function () {
	var text = 'Lorem Ipsum is simply dummy text of the printing';
	var defer = deferred();

	setTimeout(function() {
		defer.resolve(text.split(' '));
	}, 100);

	deferred.map(defer.promise, function(word) {
		var defer = deferred();

		setTimeout(function() {
			defer.resolve(word.toLowerCase());
		}, 10);

		return defer.promise;
	}).then(function(result) {
		var textLowerCase = result.join(' ');

		start();
		equal(Array.isArray(result), true, "Result is an array");
		equal(textLowerCase, text.toLowerCase(), 'Words in proper order, no one is missing');
	}, function(error) {
		equal(true, false, 'Map value is not handled properly');
	});
});

asyncTest("Processing collections - using map on value of resolved promise", function () {
	var text = 'Lorem Ipsum is simply dummy text of the printing';
	var defer = deferred();

	defer.promise.then(function(fullText) {
		var innerDefer = deferred();

		equal(fullText, text, 'Text properly passed');
		setTimeout(function() {
			innerDefer.resolve(fullText.split(' '));
		}, 100);

		return innerDefer.promise;
	}).map(function(word) {
		var defer = deferred();

		setTimeout(function() {
			defer.resolve(word.toLowerCase());
		}, 10);

		return defer.promise;
	}).then(function(result) {
		var textLowerCase = result.join(' ');

		start();
		equal(Array.isArray(result), true, "Result is an array");
		equal(textLowerCase, text.toLowerCase(), 'Words in proper order, no one is missing');
	});

	defer.resolve(text);
});

test("Reject", function () {
	var e = new Error("Error!");

	deferred().reject(e).then(function() {
		equal(false, true, "This callback should never execute");
	}, function (result) {
		equal(result, e);
	});
});

test("Reject function", function () {
	var rejected = deferred().reject('hello');

	equal(isPromise(rejected), true, "Promise");
	equal(rejected.failed, true, "Rejected");
	equal(rejected.value, 'hello', "value");
});