var assert = require('assert')
var parser = require('../parser').createParser()
var _      = require('underscore')

parser.text = true

describe('Parser', function() {

	describe('#processCodeExtraWithText()', function() {

		it('should process correctly a comment', function(done) {
			parser.processCodeExtra('// foo bar baz', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"type": "text",
							"locationSpan": {
								"start": [1,0],
								"end": [1,14]
							},
							"span": [0,14]
						}
					]
				}, data))
				done()
			})
		})

		it('should process text before and after a function inside another function', function(done) {
			parser.processCodeExtra('function f(args){ console.log("foo"); function nested() { } console.log("bar"); }', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [1,81]
							},
							"span": [0,81],
							"children": [
								{
									"type": "text",
									"locationSpan": {
										"start": [1,17],
										"end": [1,38]
									},
									"span": [17,38]
								},
								{
									"name": "nested",
									"type": "function",
									"locationSpan": {
										"start": [1,38],
										"end": [1,59]
									},
									"span": [38,59]
								},
								{
									"type": "text",
									"locationSpan": {
										"start": [1,59],
										"end": [1,80]
									},
									"span": [59,80]
								}
							]
						}
					]
				}, data))
				done()
			})
		})

		it('should find correctly the open curly bracket of a function', function(done) {
			parser.processCodeExtra('function f(args)\n { console.log("foo"); function nested() { } console.log("bar"); }', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [2, 66]
							},
							"span": [0,83],
							"children": [
								{
									"type": "text",
									"locationSpan": {
										"start": [2,2],
										"end": [2,23]
									},
									"span": [19,40]
								},
								{
									"name": "nested",
									"type": "function",
									"locationSpan": {
										"start": [2,23],
										"end": [2,44]
									},
									"span": [40,61]
								},
								{
									"type": "text",
									"locationSpan": {
										"start": [2,44],
										"end": [2,65]
									},
									"span": [61,82]
								}
							]
						}
					]
				}, data))
				done()
			})
		})

		it('should process correctly a file that is just a function, without text before and after', function(done) {
			parser.processCodeExtra('function f(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [1,14]
							},
							"span": [0,14]
						}
					]
				}, data))
				done()
			})
		})

		it('should process correctly two functions without text between them', function(done) {
			parser.processCodeExtra('function f1(){}function f2(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f1",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [1,15]
							},
							"span": [0,15]
						},
						{
							"name": "f2",
							"type": "function",
							"locationSpan": {
								"start": [1,15],
								"end": [1,30]
							},
							"span": [15,30]
						}
					]
				}, data))
				done()
			})
		})

		it('should process correctly text between functions', function(done) {
			parser.processCodeExtra('console.log("foo");\nfunction f1(){}\nconsole.log("bar");\nfunction f2(){}\nconsole.log("baz");', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"type": "text",
							"locationSpan": {
								"start": [1,0],
								"end": [2,0]
							},
							"span": [0,20]
						},
						{
							"name": "f1",
							"type": "function",
							"locationSpan": {
								"start": [2,0],
								"end": [2,15]
							},
							"span": [20,35]
						},
						{
							"type": "text",
							"locationSpan": {
								"start": [2,15],
								"end": [4,0]
							},
							"span": [35,56]
						},
						{
							"name": "f2",
							"type": "function",
							"locationSpan": {
								"start": [4,0],
								"end": [4,15]
							},
							"span": [56,71]
						},
						{
							"type": "text",
							"locationSpan": {
								"start": [4,15],
								"end": [5,19]
							},
							"span": [71,91]
						}
					]
				}, data))
				done()
			})
		})
	})
})