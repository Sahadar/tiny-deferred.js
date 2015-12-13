(function(scope) {
	'use strict';

	function isPromise(obj) {
		return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
	}

	function Deferred() {
		var self = this;
		var thenArgs = [];

		var promise = function(win, fail) {
			return promise.then(win, fail);
		};
		promise.then = function(win, fail) {
			if(promise.resolved) {
				if(typeof win === 'function') {
					(function() {
						var result = win(promise.value);

						if(typeof result !== 'undefined') {
							promise.value = result;
						}
					})();
				}
			} else if(promise.failed) {
				if(typeof fail === 'function') {
					fail(promise.value);
				}
			} else {
				thenArgs.push(arguments);
			}
			return promise;
		};
		promise.done = function() {}
		promise.dependencies = [];
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

			promise.value = resolveValue;
			if(!isPromise(resolveValue)) {
				promise.resolved = true;
				promise.settled = true;

				while(thenArgs.length) {
					promise.then.apply(self, thenArgs.shift()); 
				}
			} else {
				resolveValue.then(function(val) {
					self.resolve(val);
				});
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

			while(thenArgs.length) {
				promise.then.apply(self, thenArgs.shift()); 
			}

			return promise;
		};
	};

	function createDeferred(value) {
		return new Deferred(value);
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