tiny-deferred.js
=========

Implementation originally inspired by Mariusz Nowak's [deferred](https://github.com/medikoo/deferred)

[![Build Status](https://travis-ci.org/Sahadar/tiny-deferred.js.svg?branch=master)](https://travis-ci.org/Sahadar/tiny-deferred.js)

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

## Installation
* download from Github
* npm: `npm install tiny-deferred.js`

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

### For more working examples:

[Check out tests file](https://github.com/Sahadar/tiny-deferred.js/blob/master/test/test.js)

## License

MIT