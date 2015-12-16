(function(scope) {
	'use strict';

	function isPromise(obj) {
		return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
	}

	function Deferred() {
		var self = this;
		var awaiting = [];

		function promise(win, fail) {
			return promise.then(win, fail);
		};
		promise.then = function(win, fail) {
			var defer = createDeferred();

			if(typeof win !== 'function' && typeof fail !== 'function') {
				return promise;
			}
			if(promise.resolved) {
				if(typeof win === 'function') {
					defer.resolve(win(promise.value));
				} else {
					defer.resolve(promise.value);
				}
			} else if(promise.failed) {
				if(typeof fail === 'function') {
					fail(promise.value);
				// fail not handled = put error into console
				} else if(window && console && typeof console.error === 'function') {
					console.error(promise.value);
				}
				defer.reject(promise.value);
			} else {
				awaiting.push({
					defer : defer,
					method : 'then',
					args : arguments
				});
			}
			return defer.promise;
		};
		promise.done = function() {};
		promise.map = function(callback) {
			var defer = createDeferred();

			if(promise.resolved) {
				defer.resolve(createDeferred.map(promise.value, callback));
			} else if(promise.failed) {
				defer.reject(promise.value);
			} else {
				awaiting.push({
					defer : defer,
					method : 'map',
					args : arguments
				});
			}

			return defer.promise;
		};
		promise.reduce = function(callback) {
			var defer = createDeferred();

			if(promise.resolved) {
				defer.resolve(createDeferred.reduce(promise.value, callback));
			} else if(promise.failed) {
				defer.reject(promise.value);
			} else {
				awaiting.push({
					defer : defer,
					method : 'reduce',
					args : arguments
				});
			}

			return defer.promise;
		};
		promise.valueOf = function() {return promise.value;};
		promise.value = null;
		promise.resolved = false;
		promise.failed = false;
		promise.settled = false;

		this.promise = promise;
		this.resolve = function(resolveValue) {
			if(promise.settled) {
				return promise;
			}

			if(isPromise(resolveValue)) {
				resolveValue.then(function(val) {
					self.resolve(val);
				});
			} else {
				promise.resolved = true;
				promise.settled = true;
				promise.value = resolveValue;

				while(awaiting.length) {
					(function() {
						var data = awaiting.shift();
						var defer = data.defer;
						var method = data.method;
						var win = data.args[0];

						if(method === 'then') {
							defer.resolve(win(promise.value));
						} else if(method === 'map') {
							defer.resolve(createDeferred.map(promise.value, win));
						} else if(method === 'reduce') {
							defer.resolve(createDeferred.reduce(promise.value, win));
						}
					})();
				}
			}

			return promise;
		};
		this.reject = function(rejectValue) {
			// we cannot reject resolved promise
			if(promise.settled) {
				return promise;
			}

			promise.value = rejectValue;
			promise.failed = true;
			promise.settled = true;

			while(awaiting.length) {
				(function() {
					var data = awaiting.shift();
					var defer = data.defer;
					var fail = data.args[1];

					if(typeof fail === 'function') {
						fail(promise.value);
					}
					defer.reject(promise.value);
				})();
			}

			return promise;
		};
	};

	function createDeferred(value) {
		return new Deferred(value);
	}

	createDeferred.map = function(collection, callback) {
		var mapDefer = createDeferred();
		var collectionLength = collection.length;
		var result = [];
		var resolved = 0;

		if(isPromise(collection)) {
			collection.then(function(properCollection) {
				mapDefer.resolve(createDeferred.map(properCollection, callback));
			});
			return mapDefer.promise;
		}
		if(!Array.isArray(collection)) {
			mapDefer.reject(new Error("First map argument should be an array"));
			return mapDefer.promise;
		}
		collection.forEach(function(collectionValue, index) {
			var defer = createDeferred();

			defer.promise.then(function(value) {
				result[index] = value;
				resolved++;

				if(resolved === collectionLength) {
					mapDefer.resolve(result);
				}
			});
			result.push(defer.promise);
			defer.resolve(callback(collectionValue));
		});

		return mapDefer.promise;
	}

	createDeferred.reduce = function(collection, callback) {
		var reduceDefer = createDeferred();
		var collectionLength = collection.length;
		var lastPromise;

		// promise as first argument
		if(isPromise(collection)) {
			collection.then(function(properCollection) {
				reduceDefer.resolve(createDeferred.reduce(properCollection, callback));
			});
			return reduceDefer.promise;
		}
		if(!Array.isArray(collection)) {
			reduceDefer.reject(new Error("First map argument should be an array"));
			return reduceDefer.promise;
		}
		collection.reduce(function(previous, current, index, collection) {
			var defer = createDeferred();

			// callback(previous, value, index, collection)
			if(isPromise(current) && isPromise(previous)) {
				previous.then(function(valuePrev) {
					current.then(function(valueCurrent) {
						defer.resolve(callback(valuePrev, valueCurrent, index, collection));
					});
				});
			} else if(isPromise(current)) {
				current.then(function(valueCurrent) {
					defer.resolve(callback(previous, valueCurrent, index, collection));
				});
			} else if(isPromise(previous)) {
				previous.then(function(valuePrev) {
					defer.resolve(callback(valuePrev, current, index, collection));
				});
			} else {
				defer.resolve(callback(previous, current, index, collection));
			}
			lastPromise = defer.promise;

			return defer.promise;
		});

		lastPromise.then(function(result) {
			reduceDefer.resolve(result);
		});

		return reduceDefer.promise;
	}

	//if sbd's using requirejs library to load deferred.js
	if(typeof define === 'function') {
		define(createDeferred);
	}

	//node.js
	if(typeof module === 'object' && module.exports) {
		module.exports = createDeferred;
	}

	if(typeof window === 'object') {
		window.deferred = createDeferred;

		if(window !== scope) {
			scope.deferred = createDeferred;
		}
	}
})(this);