var assert = require('assert')
var parser = require('../parser').createParser(false)
var _      = require('underscore')

describe('Parser', function() {

	describe('#processCodeExtra()', function() {

		it('should locate functions', function(done) {
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

		it('should locate comments', function(done) {
			parser.processCodeExtra('/* one comment */ /* other comment */ function f1(){ /* inner comment 1 */ } // post comment \n function f2(){ /* inner comment 2 */ } \n // no post comment \n /* final comment */', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f1",
							"type": "function",
							"locationSpan": {
								"start": [1,18],
								"end": [1,93]
							},
							"span": [18,93]
						},
						{
							"name": "f2",
							"type": "function",
							"locationSpan": {
								"start": [2,1],
								"end": [2,39]
							},
							"span": [95,133]
						}
					]
				}, data))
				done()
			})
		})

		it('should locate functions inside multiple variable declarations', function(done) {
			parser.processCodeExtra('var x, f = function(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"locationSpan": {
								"start": [1,7],
								"end": [1,23]
							},
							"span": [7,23]
						}
					]
				}, data))
				done()
			})
		})

		it('should find simple functions in simple variable declarations', function(done) {
			parser.processCodeExtra('var f = function(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [1,20]
							},
							"span": [0,20]
						}
					]
				}, data))
				done()
			})
		})

		it('should find simple functions in simple variable declarations', function(done) {
			parser.processCodeExtra('x.f = function(){}', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "x.f",
							"type": "function",
							"locationSpan": {
								"start": [1,0],
								"end": [1,18]
							},
							"span": [0,18]
						}
					]
				}, data))
				done()
			})
		})

		it('should locate comments', function(done) {
			parser.processCodeExtra('#!/usr/bin/node\n function f1(){ /* inner comment 1 */ }', function(err, data) {
				assert.ifError(err)
				assert.ok(data)
				assert.ok(_.isEqual({
					"children": [
						{
							"name": "f1",
							"type": "function",
							"locationSpan": {
								"start": [2,1],
								"end": [2,39]
							},
							"span": [17,55]
						}
					]
				}, data))
				done()
			})
		})

	})
})