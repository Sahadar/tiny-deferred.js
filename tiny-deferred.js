(function(scope) {
	'use strict';

	var deferred = function() {
		return {
			promise : {
				then : function() {
					
				}
			}
		}
	};

	//if sbd's using requirejs library to load deferred.js
	if(typeof define === 'function') {
		define(deferred);
	}

	//node.js
	if(typeof module === 'object' && module.exports) {
		module.exports = {
			deferred : deferred
		};
	}

	if(typeof window === 'object') {
		window.deferred = deferred;

		if(window !== scope) {
			scope.deferred = deferred;
		}
	}
})(this);