var path    = require('path')
var fs      = require('fs')
var esprima = require('esprima')
var YAML    = require('yamljs')
var _       = require('underscore')

String.prototype.trim = function() { return this.replace(/^\s*|\s*$/g,'') }

exports.processFile = function(input, output, callback) {
	fs.readFile(input, 'utf8', function(err, code) {
		if (err) { return callback(err) }

		var parser = exports.createParser()
		parser.text = true
		parser.ignoreAnonymFunctions = true
		parser.compilationUnitSpans = true
		parser.removeSimpleTextNodes = true
		parser.includeVars = true
		parser.processCodeExtra(code, function(err, data) {
			if (err) { return callback(err) }

			data.name = input
			data.type = 'file'
			data.parsingErrorsDetected = false

			normalize(data)

			var useYamljs = true

			var yaml = null

			if (!useYamljs) {
				var lines = [ '---' ]
				delete data.span
				toYAML(lines, data, '', '')

				xlines = [
					'---',
					'type : file',
					'name : '+input,
					'locationSpan : {start: [1,0], end: [3,1]}',
					'footerSpan : [0, -1]',
					'span : [0, 22]',
					'parsingErrorsDetected : false',
					'',
					'children :',
					'',
					'- type : function',
					'  name : foo',
					'  locationSpan : {start: [1,0], end: [3,1]}',
					'  span : [0, 22]',
					'',
				]

				yaml = lines.join('\r\n')
			} else {
				yaml = YAML.stringify(data, 1, 4)
			}

			fs.writeFile(output, yaml, function(err) {
				if (err) { return callback(err) }
				return callback(null, yaml)
			})
		})
	})
}

var names = 1
function normalize(data) {
	if (data.locationSpan) {
		data.locationSpan.end[1] = data.locationSpan.end[1]-1
	}

	if (data.footerSpan) {
		data.footerSpan[1] = data.footerSpan[1]-1
	}

	if (data.headerSpan) {
		data.headerSpan[1] = data.headerSpan[1]-1
	}

	if (data.span) {
		data.span[1] = data.span[1]-1
	}

	data.name = data.name || ''

	if (data.children) {
		for (var i = 0; i < data.children.length; i++) {
			normalize(data.children[i])
		}
	}
}

function toYAML(lines, data, indent, firstIndent) {
	if (data.type) {
		lines.push(firstIndent+'type : '+data.type)
	}
	data.name = data.name || 'noname'
	if (data.name) {
		lines.push(indent+'name : '+data.name)
	}
	if (data.hasOwnProperty('parsingErrorsDetected')) {
		lines.push(indent+'parsingErrorsDetected : '+data.parsingErrorsDetected)
	}
	if (data.locationSpan) {
		var start = data.locationSpan.start
		var end   = data.locationSpan.end
		lines.push(indent+'locationSpan : {start: ['+start[0]+','+start[1]+'], end: ['+end[0]+','+(end[1])+']}')
	}
	if (data.footerSpan) {
		var span = data.footerSpan
		lines.push(indent+'footerSpan : ['+span[0]+','+(span[1])+']')
	}
	if (data.headerSpan) {
		var span = data.headerSpan
		// lines.push(indent+'headerSpan : ['+span[0]+','+span[1]+']')
	}
	if (data.span) {
		var span = data.span
		lines.push(indent+'span : ['+span[0]+','+(span[1])+']')
	}
	if (data.children && data.children.length > 0) {
		lines.push(indent+'')
		lines.push(indent+'children :')
		for (var i = 0; i < data.children.length; i++) {
			var child = data.children[i]
			toYAML(lines, child, indent+'  ', '- ')
		}
	}
}

exports.createParser = function(debug) {

	var parser    = {}
	var comments  = null
	var lastPoint = null

	function breaksLine(str) {
		return str.indexOf('\n') >= 0 || str.indexOf('\r') >= 0
	}

	function addMeta(node, data, start, rangeStart) {
		if (node.loc) {
			data.locationSpan = { start: [node.loc.start.line, node.loc.start.column], end: [node.loc.end.line, node.loc.end.column] }
			if (start) {
				data.locationSpan.start = [start.line, start.column]
			}
		}
		if (node.range) {
			data.span = node.range
			if (typeof rangeStart !== 'undefined') {
				data.span[0] = rangeStart
			}
		}
	}

	function metaStart(node, start) {
		if (typeof start !== 'undefined') return start
		return node.loc && node.loc.start
	}

	function metaRangeStart(node, rangeStart) {
		if (typeof rangeStart !== 'undefined') return rangeStart
		return node.range && node.range[0]
	}

	function findCurlyBracketsLocation(str, initialLine, initialSpan) {
		var i = str.indexOf('{')+1
		str = str.substring(0, i).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
		var lines = str.split('\n')
		var lastLine = lines[lines.length-1]
		return {
			span: initialSpan+i,
			line: initialLine+lines.length-1,
			column: lastLine.length
		}
	}

	// doc https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
	function processNode(node, children, start, rangeStart) {
		if (!node) return
		if (_.isArray(node)) {
			var arr = node
			for (var i = 0; i < arr.length; i++) {
				processNode(arr[i], children, start, rangeStart)
			}
			return
		}

		function createNode(data, newlastPoint, processFunction) {
			if (comments) {
				var preComment = null, postComment = null
				var lastUsedCommentIndex = -1
				for (var i = 0; i < comments.length; i++) {
					var comment = comments[i]

					if (comment.range[0] < data.span[0]) {
						preComment = comment
						lastUsedCommentIndex = i
					} else if (comment.range[1] > data.span[1]) {
						postComment = comment
						lastUsedCommentIndex = i
						break
					}
				}
				if (preComment) {
					var str = parser.code.substring(preComment.range[1], data.span[0])
					if (str.trim().length === 0) {
						data.span[0] = preComment.range[0]
						data.locationSpan.start = [preComment.loc.start.line, preComment.loc.start.column]
					}
				}
				if (postComment) {
					var str = parser.code.substring(data.span[1], postComment.range[0])
					if (str.trim().length === 0 && !breaksLine(str)) {
						data.span[1] = postComment.range[1]
						data.locationSpan.end = [postComment.loc.end.line, postComment.loc.end.column]
					}
				}

				if (lastUsedCommentIndex >= 0) {
					comments = comments.slice(lastUsedCommentIndex+1)
				}
			}

			if (parser.text) {
				if (lastPoint) {
					if (data.span[0] > lastPoint.span) {
						children.push({
							type: 'text',
							locationSpan: {
								start: [lastPoint.line, lastPoint.column],
								end: data.locationSpan.start
							},
							span: [lastPoint.span, data.span[0]]
						})
					}
				} else {
					if (data.span[0] > 0) {
						children.push({
							type: 'text',
							locationSpan: {
								start: [1,0],
								end: data.locationSpan.start
							},
							span: [0, data.span[0]]
						})
					}
				}
			}
			lastPoint = newlastPoint
			var childnodes = []
			processFunction(node, childnodes)
			if (childnodes.length > 0) {
				data.children = childnodes
			}

			if (newlastPoint && lastPoint && lastPoint.span > newlastPoint.span) {
				childnodes.push({
					type: 'text',
					locationSpan: {
						start: [lastPoint.line, lastPoint.column],
						end: [data.locationSpan.end[0], data.locationSpan.end[1]-1]
					},
					span: [lastPoint.span, data.span[1]-1]
				})
			}

			children.push(data)
			if (parser.text) {
				lastPoint = {
					span: data.span[1],
					line: data.locationSpan.end[0],
					column: data.locationSpan.end[1]
				}
			}
		}

		if (node.type === 'Program') {
			processNode(node.body, children)
		} else if (node.type === 'BlockStatement') {
			processNode(node.body, children)
		} else if (node.type === 'IfStatement') {
			processNode(node.consequent, children)
			processNode(node.alternate, children)
		} else if (node.type === 'ConditionalExpression') {
			processNode(node.test, children)
			processNode(node.consequent, children)
			processNode(node.alternate, children)
		} else if (node.type === 'LogicalExpression') {
			processNode(node.left, children)
			processNode(node.right, children)
		} else if (node.type === 'UnaryExpression') {
			processNode(node.argument, children)
		} else if (node.type === 'BinaryExpression') {
			processNode(node.left, children)
			processNode(node.right, children)
		} else if (node.type === 'CallExpression') {
			processNode(node.callee, children)
			processNode(node.arguments, children)
		} else if (node.type === 'NewExpression') {
			processNode(node.callee, children)
		} else if (node.type === 'WithStatement') {
			processNode(node.object, children)
			processNode(node.body, children) // another scope?
		} else if (node.type === 'ThrowStatement') {
			processNode(node.argument, children)
		} else if (node.type === 'ObjectExpression') {
			processNode(node.properties, children)
		} else if (node.type === 'ArrayExpression') {
			processNode(node.elements, children)
		} else if (node.type === 'WhileStatement') {
			processNode(node.test, children)
			processNode(node.body, children)
		} else if (node.type === 'DoWhileStatement') {
			processNode(node.test, children)
			processNode(node.body, children)
		} else if (node.type === 'ForInStatement') {
			processNode(node.left, children)
			processNode(node.right, children)
			processNode(node.body, children)
		} else if (node.type === 'ForStatement') {
			processNode(node.init, children)
			processNode(node.test, children)
			processNode(node.update, children)
			processNode(node.body, children)
		} else if (node.type === 'SwitchStatement') {
			processNode(node.discriminant, children)
			processNode(node.cases, children)
		} else if (node.type === 'SwitchCase') {
			processNode(node.test, children)
			processNode(node.consequent, children)
		} else if (node.type === 'TryStatement') {
			processNode(node.block, children)
			processNode(node.handlers, children)
			processNode(node.finalizer, children)
		} else if (node.type === 'CatchClause') {
			processNode(node.body, children)
		} else if (node.type === 'ReturnStatement') {
			processNode(node.argument, children)
		} else if (node.type === 'VariableDeclaration') {
			if (parser.includeVars && node.declarations.length === 1 && node.declarations[0].init.type === 'ObjectExpression') {
				var oldNode = node
				node = node.declarations[0]
				node.loc = oldNode.loc
				node.range = oldNode.range

				var data = {}
				data.name = (node.id && node.id.name) || ''
				data.type = 'var'

				var init = node.init

				var newlastPoint = {
					span: init.range[0]+1,
					line: init.loc.start.line,
					column: init.loc.start.column+1
				}

				addMeta(node, data, start, rangeStart)
				
				createNode(data, newlastPoint, function(node, childnodes) {
					processNode(node.init, childnodes)
				})

			} else {
				if (node.declarations.length === 1) { // preserve span if only one declaration
					processNode(node.declarations, children, metaStart(node), metaRangeStart(node))
				} else {
					processNode(node.declarations, children)
				}
			}
		} else if (node.type === 'VariableDeclarator') {
			if (node.id && node.id.type === 'Identifier' && node.init && node.init.type === 'FunctionExpression') {
				var _node = node.init
				_node.id = { name: node.id.name }
				processNode(_node, children, metaStart(node, start), metaRangeStart(node, rangeStart))
			} else {
				processNode(node.id, children)
				processNode(node.init, children)
			}
		} else if (node.type === 'Property') {
			if (node.key && node.key.type === 'Identifier' && node.key.name && node.value && node.value.type === 'FunctionExpression') {
				var _node = node.value
				_node.id = { name: node.key.name }
				if (node.range) {
					_node.range[0] = node.range[0]
					_node.loc.start = node.loc.start
				}
				processNode(_node, children)
			} else {
				processNode(node.key, children)
				processNode(node.value, children)
			}
		} else if (node.type === 'ExpressionStatement') {
			processNode(node.expression, children)
		} else if (node.type === 'MemberExpression') {
			processNode(node.object, children)
			processNode(node.property, children)
		} else if (node.type === 'AssignmentExpression') {
			if (node.operator === '='
				&& node.left.type === 'MemberExpression'
				&& node.right.type === 'FunctionExpression'
				&& (!node.left.computed || (node.left.property && node.left.property.type === 'Literal')) ) {

				// accepted expressions:
				// obj.foo = function...
				// obj["foo"] = function...
				// unaccepted expression:
				// obj[foo] = function...

				var left  = node.left
				var right = node.right

				var name = null
				if (left.object && left.object.name) {
					if (left.property.type === 'Identifier') {
						name = left.object.name+'.'+left.property.name
					} else if (left.property.type === 'Literal') {
						name = left.object.name+'.'+left.property.value
					}
				} else {
					name = ''
				}

				if (name !== null) {
					right.id = {}
					right.type = 'FunctionDeclaration'
					right.id.name = name
					return processNode(right, children, metaStart(node), metaRangeStart(node))
				}
			}

			// if the execution has arrived here, process the expression normally
			processNode(node.left, children)
			processNode(node.right, children)

		} else if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
			var data = {}
			data.name = (node.id && node.id.name) || ''
			data.type = 'function'

			if (parser.ignoreAnonymFunctions && data.name === '') {
				return processNode(node.body, children)
			}

			if (parser.text) {
				var str = parser.code.substring(node.range[0], node.range[1])
				var newlastPoint = findCurlyBracketsLocation(str, node.loc.start.line, node.range[0])
			}

			addMeta(node, data, start, rangeStart)
			
			createNode(data, newlastPoint, function(node, childnodes) {
				processNode(node.body, childnodes)
			})

		} else if (node.type === 'Identifier') {
			// such as "foo" (without the quotes)
		} else if (node.type === 'Literal') {
			// such as "foo" (with the quotes)
		} else if (node.type === 'UpdateExpression') {
			// such as "i++"
		} else if (node.type === 'EmptyStatement') {
		} else if (node.type === 'BreakStatement') {
		} else if (node.type === 'ThisExpression') {
		} else {
			if (true || debug) {
				console.log('unknown node type! ---------------------------------', node)
			}
		}
	}

	function createProcessor(options) {
		return function(code, callback) {
			lastPoint = null

			// remove shebang if present
			var shebang = false
			if (code[0] === '#' && code[1] === '!') {
				code = '//' + code.substr(2)
				shebang = true
			}

			parser.code = code

			var tree = esprima.parse(code, options)
			if (debug) {
				console.log(JSON.stringify(tree, null, 4))
			}

			var data = { children: [] }
			comments = tree.comments

			if (shebang) {
				// remove shebang comment
				comments = comments.slice(1)
			}

			processNode(tree, data.children)
			if (parser.text) {
				if (lastPoint) {
					if (tree.range[1] > lastPoint.span) {
						data.children.push({
							type: 'text',
							locationSpan: {
								start: [lastPoint.line, lastPoint.column],
								end: [tree.loc.end.line, tree.loc.end.column]
							},
							span: [lastPoint.span, tree.range[1]]
						})
					}
				} else if (tree.range[1] > 0) { // no children if file is empty
					data.children.push({
						type: 'text',
						locationSpan: {
							start: [1,0],
							end: [tree.loc.end.line, tree.loc.end.column]
						},
						span: [0, tree.range[1]]
					})
				}
			}

			if (parser.compilationUnitSpans) {
				if (tree.loc) {
					data.locationSpan = {
						start: [tree.loc.end.line === 0 ? 0 : 1,0],
						end: [tree.loc.end.line, tree.loc.end.column]
					}
				}

				data.footerSpan = [0, 0]
				// data.headerSpan = [0, 0]
				if (tree.range) {
					data.span = [0, tree.range[1]]
				}
			}

			if (tree.errors && tree.errors.length > 0) {
				var errors = []
				for (var i = 0; i < tree.errors.length; i++) {
					var error = tree.errors[i]
					errors.push({
						location: [error.lineNumber, error.column],
						message: error.description
					})
				}
				data.errors = errors
			}

			if (debug) {
				console.log(JSON.stringify(data, null, '\t'))
			}

			if (parser.removeSimpleTextNodes) {
				function removeSimpleNodes(node) {
					
					var children = node.children
					if (children) {
						for (var i = 0; i < children.length; i++) {
							var child = children[i]
							var nextNode = children[i+1]
							var previousNode = children[i-1]

							if (child.type === 'text') {
								var str = parser.code.substring(child.span[0], child.span[1])
								if (str.match(/^[\s,]+$/)) {
									if (nextNode) {
										nextNode.locationSpan.start = child.locationSpan.start
										nextNode.span[0] = child.span[0]
										children.splice(i, 1)
										i--
										continue
									} else if (previousNode) {
										previousNode.locationSpan.end = child.locationSpan.end
										previousNode.span[1] = child.span[1]
										children.splice(i, 1)
										i--
										continue
									}
								}
							}
							removeSimpleNodes(child)
						}
					}
				}

				removeSimpleNodes(data)
			}

			callback(null, data)
		}
	}

	parser.processCode = createProcessor({ comment: true, tolerant: true })
	parser.processCodeExtra = createProcessor({ loc: true, tolerant: true, range: true, comment: true })

	return parser
}
