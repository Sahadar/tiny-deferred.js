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

		this.promise = promise;
		this.resolve = function(resolveValue) {
			if(promise.resolved) {
				return promise;
			}

			promise.value = resolveValue;
			if(!isPromise(resolveValue)) {
				promise.resolved = true;

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
		module.exports = {
			deferred : createDeferred
		};
	}

	if(typeof window === 'object') {
		window.deferred = createDeferred;

		if(window !== scope) {
			scope.deferred = createDeferred;
		}
	}
})(this);