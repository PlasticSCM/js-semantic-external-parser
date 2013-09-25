var assert = require('assert')
var parser = require('../parser').createParser()
var _      = require('underscore')

parser.text = true
parser.ignoreAnonymFunctions = true

describe('Parser', function() {

	describe('#processCodeExtraWithText()', function() {

		it('should ignore anonymous functions', function(done) {
			parser.processCodeExtra('(function() { function nested(){ console.log("foo") } })()', function(err, data) {
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
						},
						{
							"name": "nested",
							"type": "function",
							"locationSpan": {
								"start": [1,14],
								"end": [1,53]
							},
							"span": [14,53]
						},
						{
							"type": "text",
							"locationSpan": {
								"start": [1,53],
								"end": [1,58]
							},
							"span": [53,58]
						}
					]
				}, data))
				done()
			})
		})

		it('should ignore anonymous functions', function(done) {
			parser.processCodeExtra('obj.value1 = function(){}; obj["value2"] = function(){}; obj[value3] = function(){}; foo()["f"] = function(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "obj.value1",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [1,25]
							},
							"span": [0,25]
						},
						{
							"type": "text",
							"locationSpan": {
								"start": [1,25],
								"end": [1,27]
							},
							"span": [25,27]
						},
						{
							"name": "obj.value2",
							"type": "function",
							"locationSpan": {
								"start": [1,27],
								"end": [1,55]
							},
							"span": [27,55]
						},
						{
							"type": "text",
							"locationSpan": {
								"start": [1,55],
								"end": [1,110]
							},
							"span": [55,110]
						}
					]
				}, data))
				done()
			})
		})

		// it('should ignore anonymous functions', function(done) {
		// 	parser.processCodeExtra('var foo = "bar"; return', function(err, data) {
		// 		assert.ifError(err)
		// 		assert.ok(data)
		// 		assert.ok(_.isEqual({
		// 			"children": [
		// 				{
		// 					"type": "text",
		// 					"locationSpan": {
		// 						"start": [1,0],
		// 						"end": [1,23]
		// 					},
		// 					"span": [0,23]
		// 				}
		// 			],
		// 			"errors": [
		// 				{
		// 					"location": [1,24],
		// 					"message": undefined
		// 				}
		// 			]
		// 		}, data))
		// 		done()
		// 	})
		// })
	})
})