'use strict';

QUnit.module('tiny-deferred');

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

test("Nesting with reject", function () {
	var defer = deferred();
	var innerDefer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.promise.then(function() {
		current = values[0];

		return innerDefer.promise;
	}).then(function() {
		current = values[1];
	}).always(function() {
		current = values[2];
	});

	defer.resolve(values);
	innerDefer.reject('test');
	equal(current, values[2], 'Current has to be filled by always not by then callback');
});

test("Nesting - value delivering", function () {
	var defer = deferred();
	var innerDefer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.promise.then(function(givenValue) {
		current = givenValue[0];

		return innerDefer.promise;
	}).then(function(givenValue) {
		current = givenValue[1];
		notEqual(true, true, 'Shouldnt go through win path');
		return givenValue;
	}, function(givenValue) {
		equal(true, true, 'Should go through fail path');
		return givenValue;
	}).always(function(givenValue) {
		current = givenValue[2];
	});

	defer.resolve(values);
	innerDefer.reject(values);
	equal(current, values[2], 'Current has to be filled by always not by then callback');
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
		});

		return def.promise;
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
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
		});

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
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
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
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
	});

	defer1.resolve(promise2);
	setTimeout(function() {
		start();
		defer2.resolve(x);
	}, 500);
});

QUnit.module('Map method');

asyncTest("Processing collections - map", function () {
	var text = 'Lorem Ipsum is simply dummy text of the printing';

	deferred.map(text.split(' '), function(word) {
		var defer = deferred();

		setTimeout(function() {
			defer.resolve(word.toLowerCase());
		});

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
	});

	deferred.map(defer.promise, function(word) {
		var defer = deferred();

		setTimeout(function() {
			defer.resolve(word.toLowerCase());
		});

		return defer.promise;
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
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
		});

		return innerDefer.promise;
	}).map(function(word) {
		var defer = deferred();

		setTimeout(function() {
			defer.resolve(word.toLowerCase());
		});

		return defer.promise;
	}).then(function(result) {
		var textLowerCase = result.join(' ');

		start();
		equal(Array.isArray(result), true, "Result is an array");
		equal(textLowerCase, text.toLowerCase(), 'Words in proper order, no one is missing');
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
	});

	defer.resolve(text);
});

QUnit.module('Reduce method');

asyncTest("Processing collections - reduce", function () {
	var defer1 = deferred();
	var defer2 = deferred();
	var defer3 = deferred();
	var values = [2,3,8];

	deferred.reduce([defer1.promise, defer2.promise, defer3.promise], function(previous, current, index, collection) {
		var defer = deferred();

		equal(current, values[index], "Proper value for index "+index);

		setTimeout(function() {
			defer.resolve(previous+current);
		});

		return defer.promise;
	}).then(function(result) {
		start();
		equal(result, values[0]+values[1]+values[2], "Proper result");
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
	});

	defer1.resolve(values[0]);
	defer2.resolve(values[1]);
	defer3.resolve(values[2]);
});

asyncTest("Processing collections - reduce as a method of promise", function () {
	var mainDefer = deferred();
	var defer1 = deferred();
	var defer2 = deferred();
	var defer3 = deferred();
	var values = [2,3,8];

	mainDefer.promise.reduce(function(previous, current, index, collection) {
		var defer = deferred();

		equal(current, values[index], "Proper value for index "+index);

		setTimeout(function() {
			defer.resolve(previous+current);
		});

		return defer.promise;
	}).then(function(result) {
		start();
		equal(result, values[0]+values[1]+values[2], "Proper result");
	});

	mainDefer.resolve([defer1.promise, defer2.promise, defer3.promise]);
	defer1.resolve(values[0]);
	defer2.resolve(values[1]);
	defer3.resolve(values[2]);
});

asyncTest("Processing collections - reduce - not only promises", function () {
	var defer1 = deferred();
	var defer2 = deferred();
	var defer3 = deferred();
	var values = [2,3,8];
	var current = [1,3,2,8];
	var previous = [2,3,6,8];

	deferred.reduce([defer1.promise, 1, defer2.promise, 2, defer3.promise], function(prev, curr, index, collection) {
		var defer = deferred();

		equal(curr, current[index-1], "Proper \"current\" value for index "+index);
		equal(prev, previous[index-1], "Proper \"previous\" value for index "+index);

		setTimeout(function() {
			defer.resolve(prev+curr);
		});

		return defer.promise;
	}).then(function(result) {
		start();
		equal(result, values[0]+values[1]+values[2]+1+2, "Proper result");
	}, function() {
		notEqual(true, true, "Shouldn't go through fail path");
	});

	setTimeout(function() {
		defer3.resolve(values[2]);
		setTimeout(function() {
			defer1.resolve(values[0]);
			setTimeout(function() {
				defer2.resolve(values[1]);
			}, 50);
		}, 50);
	}, 50);
});

asyncTest("Processing collections - reduce - on normal values", function () {
	var values = [2,3,8];
	var current = [1,3,2,8];
	var previous = [2,3,6,8];

	deferred.reduce([values[0], 1, values[1], 2, values[2]], function(prev, curr, index, collection) {
		var defer = deferred();
		
		equal(curr, current[index-1], "Proper \"current\" value for index "+index);
		equal(prev, previous[index-1], "Proper \"previous\" value for index "+index);

		setTimeout(function() {
			defer.resolve(prev+curr);
		});

		return defer.promise;
	}).then(function(result) {
		start();
		equal(result, values[0]+values[1]+values[2]+1+2, "Proper result");
	});
});

QUnit.module('Finally');

test("Test 'always' method - after resolve", function () {
	var defer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.resolve('test');
	defer.promise.then(function() {
		current = values[0];
	}).always(function() {
		current = values[1];
	});

	equal(current, values[1], 'Current has to be filled by always not by then callback');
});

asyncTest("Async test 'always' method - after resolve", function () {
	var defer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.promise.then(function() {
		current = values[0];
	}).always(function() {
		current = values[1];
	});

	setTimeout(function() {
		defer.resolve('test');
		start();
		equal(current, values[1], 'Current has to be filled by always not by then callback');
	});
});

test("Test 'always' method - after reject", function () {
	var defer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.reject('test');
	defer.promise.then(function() {
		current = values[0];
	}).always(function() {
		current = values[1];
	});

	equal(current, values[1], 'Current has to be filled by always not by then callback');
});

asyncTest("Async test 'always' method - after reject", function () {
	var defer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.promise.then(function(givenValue) {
		current = values[0];
		notEqual(true, true, "Shoultn't go through win path")
	}, function(givenValue) {
		equal(true, true, "Should go through fail path");
		equal('test', givenValue, "Properly given value");
	}).always(function() {
		current = values[1];
	});

	setTimeout(function() {
		defer.reject('test');
		start();
		equal(current, values[1], 'Current has to be filled by always not by then callback');
	});
});

test("'Always' method - after reject another scenario", function () {
	var defer = deferred();
	var innerDefer = deferred();
	var values = [2,3,8];
	var current = null;

	defer.promise.then(function() {
		current = values[0];

		return innerDefer.promise;
	}).always(function() {
		current = values[1];
	});

	defer.resolve('test');
	innerDefer.reject('test');
	equal(current, values[1], 'Current has to be filled by always not by then callback');
});

QUnit.module('Reject');

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