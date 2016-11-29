tiny-deferred.js
=========

Implementation originally inspired by Mariusz Nowak's [deferred](https://github.com/medikoo/deferred)

[![Build Status](https://travis-ci.org/Sahadar/tiny-deferred.js.svg?branch=master)](https://travis-ci.org/Sahadar/tiny-deferred.js)
[![Dependency Status](https://david-dm.org/Sahadar/tiny-deferred.js.svg)](https://david-dm.org/Sahadar/tiny-deferred.js)
[![License](https://img.shields.io/npm/l/tiny-deferred.js.svg)](http://opensource.org/licenses/MIT)

[NPM tiny-deferred.js link](https://npmjs.org/package/tiny-deferred.js)

## Features

* Very fast
* Easy to understand
* Dependency free
* Using native JavaScript code
* Works on server and browser side smoothly
* Works with require.js library
* Written with TDD
* Compiled + gzipped weighs less than 1kB

Why to use tiny-deferred?
* You dont have to remember about .catch'ing errors - **this library is automatically showing catched JS errors! No more hidden JS errors**

## Installation
* download from Github
* npm: `npm install tiny-deferred.js`
* bower: `bower install tiny-deferred`

## Methods

**tiny-deferred.js** is chainable, it means that every method is returning new promise instance.

### defer.resolve(value/promise)
Value can be a callback, promise or data
Resolving awaiting deferreds and executing win callbacks

### defer.resolve(value/promise)
Value can be a callback, promise or data
Resolving awaiting deferreds and executing fail callbacks

### promise.then(win, fail)
After defer.resolve() - executing win callback
After defer.reject() - executing fail callback

### promise.always(callback)
After defer.resolve() and defer.reject() - executing callback

## Examples

### Basic example
```javascript
var defer = deferred();

defer.resolve(1);
// async execution - imagine ajax call
setTimeout(function() {
	// only first resolve is taken - so the value will be 1
	defer.resolve(2);

	console.log(defer.promise.resolved); // true
	console.log(defer.promise.value); // 1
	console.log(defer.promise.valueOf()); // 1
}, 100);
```

### Nesting
```javascript
var defer1 = deferred(),
	defer2 = deferred(),
	x = {},
	promise;

// defer1 will still be waiting for defer2 resolve
defer1.resolve(defer2.promise);
// this callback will be postponed until defer2 resolves
promise = defer1.promise.then(function(arg) {
	return [arg, 'foo'];
});
// defer2 resolves so defer1 will immadietely execute awaiting callbacks
defer2.resolve(x);

console.log(promise.resolved); // true (promise is resolved)
console.log(promise.value); // [{}, 'foo']
```

### Nesting - another example
```javascript
var defer1 = deferred(),
	promise1 = defer1.promise,
	x = {},
  	defer2 = deferred(),
  	promise2 = defer2.promise;

promise1(function (result) {
	// "result" will be the same as a value of promise2
	console.log(result); // {}
});

// promise1 will be waiting to execute awaiting callbacks until defer2 resolves
defer1.resolve(promise2);
// imagine ajax call
setTimeout(function() {
	defer2.resolve(x);
}, 100);
```

### Chaining
```javascript
var defer = deferred(),
	promise = defer.promise,
	arg1 = 'arg1',
	arg2 = 'arg2',
	arg3 = 'arg3';

// this chain will be postponed until defer resolves
promise.then(function(value) {
	var def = deferred();

	// argument will be the same as resolved value
	console.log(value); // 'arg1'

	setTimeout(function() {
		def.resolve(arg2);
	}, 100);

	// then callback can be either a promise
	return def.promise;
}).then(function(value) {
	var def = deferred();

	// argument will be the same as resolved value
	console.log(value); // 'arg2'

	// this log is important
	// - promises chain execution each time creates new promise
	// - will not change already resolved promise value
	// - "promise" var points to initially created deferred's promise
	console.log(promise.value); // 'arg1'

	def.resolve(arg3);

	return def.promise;
}).then(function(value) {
	// argument will be the same as resolved value
	console.log(value); // 'arg3'

	return value;
}).then(function(value) {
	var def = deferred();

	setTimeout(function() {
		// previously we have just returned argument - nothing changed
		console.log(value); // 'arg3'

		def.resolve(arg1+value);
	}, 100);

	return def.promise;
}).then(function(test) {
	// result of concatenating arg1+value
	console.log(value); // 'arg1arg3'
});

// imagine here ajax call
setTimeout(function() {
	// defer resolves - execute chain
	defer.resolve(arg1);
}, 100);
```

### Executing more callbacks on resolve
```javascript
var defer = deferred(),
	promise = defer.promise,
	count = 0;

// we can bind to promise as many callbacks as we want
// these callbacks will be executed 'fifo' order
promise(function () {
	// executes first
	++count;
});

promise(function () {
	// executes second
	console.log(count); // 1
});

defer.resolve(x);
```

### Processing collections - map
```javascript
var text = 'Lorem Ipsum is simply dummy text of the printing';

deferred.map(text.split(' '), function(word) {
	var defer = deferred();

	setTimeout(function() {
		defer.resolve(word.toLowerCase());
	}, 10);

	return defer.promise;
}).then(function(result) {
	var textLowerCase = result.join(' ');

	console.log(Array.isArray(result)); // true
	// same order - no missing words
	console.log(textLowerCase === text.toLowerCase()); // true
});
```

### Processing collections - reduce
```javascript
var defer1 = deferred();
var defer2 = deferred();
var defer3 = deferred();
var values = [2,3,8];

deferred.reduce([defer1.promise, 1, defer2.promise, defer3.promise], function(previous, current, index) {
	var defer = deferred();
	
	// index always starts from 1, not 0 - as in Array.prototype.reduce specification
	if(index === 1) {
		console.log(previous, current, index); // 2, 1, 1
	} else if(index === 2) {
		console.log(previous, current, index); // 3, 3, 2
	} else if(index === 3) {
		console.log(previous, current, index); // 6, 8, 3
	}

	setTimeout(function() {
		defer.resolve(previous+current);
	}, 10);

	return defer.promise;
}).then(function(result) {
	console.log(result); // 14
});

defer1.resolve(values[0]);
defer2.resolve(values[1]);
defer3.resolve(values[2]);
```

### For more working examples:

[Check out tests file](https://github.com/Sahadar/tiny-deferred.js/blob/master/test/test.js)

## License

MIT