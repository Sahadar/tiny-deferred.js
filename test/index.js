QUnit.module('tiny-deferred', {
	setup : function() {
	}
})

test("Basic test", function () {
    var value = "hello";
    
    ok(true, "this test is fine");
    equal("hello", value, "We expect value to be hello");
});