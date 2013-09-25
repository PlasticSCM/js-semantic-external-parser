var assert = require('assert')
var parser = require('../parser').createParser()
var _      = require('underscore')

describe('Parser', function() {

	describe('#processCode()', function() {

		it('should find simple functions', function(done) {
			parser.processCode('function f(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function"
						}
					]
				}, data))
				done()
			})
		})

		it('should find simple functions', function(done) {
			parser.processCode('function f(){} function nested(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function"
						},
						{
							"name": "nested",
							"type": "function"
						}
					]
				}, data))
				done()
			})
		})

		it('should find nested functions', function(done) {
			parser.processCode('function f(){ function nested(){} }', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data))
				done()
			})
		})

		it('should find simple function assignments', function(done) {
			parser.processCode('var f = function(){ function nested(){} }', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data))
				done()
			})
		})

		it('should find simple function assignments', function(done) {
			parser.processCode('var obj = {}; obj.f = function(){ function nested(){} }', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "obj.f",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data))
				done()
			})
		})

		it('should find simple function assignments', function(done) {
			var code = 'var obj = {}; obj["f"] = function(){ function nested(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "obj.f",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find simple function assignments', function(done) {
			var code = 'var obj = {}; foo()["f"] = function(){ function nested(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in logical expressions', function(done) {
			var code = 'var a = "foo" || (function(){ function nested(){} })()'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in binary expressions', function(done) {
			var code = 'var a = 1 + (function(){ function nested(){} })()'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in array expressions', function(done) {
			var code = 'var arr = [(function(){ function nested(){} })()]'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in binary expressions', function(done) {
			var code = 'var arr = []; arr[(function(){ function nested(){} })()] = 3'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in object expressions', function(done) {
			var code = 'var obj = { foo: function(){ function nested(){} } }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "foo",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "if" statements', function(done) {
			var code = 'if (true) { function nested(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "if-else" statements', function(done) {
			var code = 'if (true) { function nested1(){} } else if(true) { function nested2(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "if-elseif-else" statements', function(done) {
			var code = 'if (true) { function nested1(){} } else if(true) { function nested2(){} } else { function nested3(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						},
						{
							"name": "nested3",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "for" statements', function(done) {
			var code = 'for (var i=0; i<arr.length; i++) { function nested(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "forin" statements', function(done) {
			var code = 'var obj = {}; for (var key in obj) { function nested(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "while" statements', function(done) {
			var code = 'while ( (function nested1(){}) > (function nested2(){}) ) { function nested3(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						},
						{
							"name": "nested3",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "do-while" statements', function(done) {
			var code = 'do { function nested3(){} } while ( (function nested1(){}) > (function nested2(){}) )'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						},
						{
							"name": "nested3",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process unary expressions', function(done) {
			var code = 'var a = typeof (function(){ function nested(){} })'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "switch" statements', function(done) {
			var code = 'switch(a) { case 1: function nested1(){}; break; case 2: function nested2(){}; default: function nested3(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						},
						{
							"name": "nested3",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "return" statements', function(done) {
			var code = 'function f(){ return function nested(){}() }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "throw" statements', function(done) {
			var code = 'function f(){ throw function nested(){}() }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"children": [
								{
									"name": "nested",
									"type": "function"
								}
							]
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process "new" expressions', function(done) {
			var code = 'var a = new (function nested() { })'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should process conditional expressions', function(done) {
			var code = 'var a = (function nested1() { }) ? (function nested2() { }) : (function nested3() { })'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						},
						{
							"name": "nested3",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in arguments', function(done) {
			var code = 'fs.readFile(path, function nested1() { })'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in "with" statements', function(done) {
			var code = 'with( (function nested1() {})() ) { function nested2(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})

		it('should find functions in "try-catch-finally" statements', function(done) {
			var code = 'try { function nested1(){} } catch (e) { function nested2(){} } finally { function nested3(){} }'
			parser.processCode(code, function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "nested1",
							"type": "function"
						},
						{
							"name": "nested2",
							"type": "function"
						},
						{
							"name": "nested3",
							"type": "function"
						}
					]
				}, data), code)
				done()
			})
		})
	})
})