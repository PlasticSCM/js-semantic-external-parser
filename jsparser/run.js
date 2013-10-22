var fs       = require('fs')
var path     = require('path')
var readline = require('readline')
var parser   = require('./parser')

var events   = []

function addEvent(event) {
	events.push(event)
	fs.writeFileSync(path.join(__dirname, 'arguments.txt'), events.join('\n'), 'utf8')
}

function runAsShell(flag) {
	addEvent('shell '+flag)

	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})

	var fileIn  = null
	var fileOut = null
	rl.on('line', function(cmd) {
		if (cmd === 'end') {
			addEvent('end!!!!')
			finish()
		} else if (!fileIn) {
			fileIn = cmd
		} else {
			fileOut = cmd
			addEvent('fileIn = '+JSON.stringify(fs.readFileSync(fileIn, 'utf8')))
			parser.processFile(fileIn, fileOut, function(err, output) {
				if (err) {
					addEvent('error '+fileOut)
					process.stdout.write('KO\r\n')
					// return finish(err)
				} else {
					addEvent('------------------------------------------------')
					addEvent(output)
					process.stdout.write('OK\r\n')
				}
				fileIn  = null
				fileOut = null
			})
		}
	})

	function finish(err) {
		fs.unlinkSync(flag)
		if (err) console.error(err)
		process.exit(1)
	}

	try {
		fs.writeFileSync(flag, '')
	} catch (e) {
		addEvent('error: '+e.stack)
	}

	// addEvent('resume')
	// process.stdin.resume()
	// addEvent('setencoding')
	// process.stdin.setEncoding('utf8')

	// addEvent('waiting')

	rl.on('close', function() {
		addEvent('close')
		finish()
	})
}

// command line application starting point
if (module.id === require.main.id) {

	process.on('uncaughtException', function(e) {
		addEvent('error '+e.stack)
		process.exit(0)
	})

	if (process.argv.length === 4) {
		if (process.argv[2] === 'shell') {
			addEvent('executing as shell '+new Date())
			runAsShell(process.argv[3])
		} else {
			parser.processFile(process.argv[2], process.argv[3], function(err, output) {
				if (err) {
					console.error(err)
				} else {
					console.log('OK')
				}
			})
		}
	}
}
