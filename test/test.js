'use strict';

QUnit.module('tiny-deferred', {
	setup : function() {
		return {
			x : {}
		}
	}
})

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

	defer.promise.done();
	defer.resolve(1);
	defer.resolve(2);

	ok(defer.promise.valueOf() === 1);
});

test("Only first resolve is taken", function (assert) {
	var defer1 = deferred(),
		defer2 = deferred(),
		x = {},
		promise;

	defer1.resolve(defer2.promise);
	promise = defer1.promise(function (arg) {
		return [arg, 'foo'];
	});
	defer2.resolve(x);

	equal(promise.resolved, true, "Transfered");
	deepEqual(promise.value, [x, 'foo'], "Transfered value");
});

test("Resolve corner case", function (assert) {
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

test("Call all then callbacks in order", function (assert) {
	var defer = deferred(),
		promise = defer.promise,
		x = {},
		count = 0;

	promise(function () {
		++count;
	}).done();

	promise(function () {
		equal(count, 1);
	}).done();

	defer.resolve(x);
});

test("Resolve promise with other promise", function (assert) {
	var defer1 = deferred(),
		promise1 = defer1.promise,
		x = {},
	  	defer2 = deferred(),
	  	promise2 = defer2.promise;

	promise1(function (result) {
		equal(result, x);
	}).done();

	defer1.resolve(promise2);
	defer2.resolve(x);
});

test("Reject", function (assert) {
	var e = new Error("Error!");

	deferred().reject(e).done(function() {
		equal(false, true, "This callback should never execute");
	}, function (result) {
		equal(result, e);
	});
});

test("Reject function", function (assert) {
	var rejected = deferred.reject('hello');

	equal(isPromise(rejected), true, "Promise");
	equal(rejected.failed, true, "Rejected");
	equal(rejected.value, 'hello', "value");
});