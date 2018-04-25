#!/usr/bin/env node

'use strict'

let projectPath, listenPort

if (process.argv.length === 3) {
	projectPath = process.argv[2]
	listenPort = 8080
} else if (process.argv.length === 4) {
	projectPath = process.argv[2]
	listenPort = parseInt(process.argv[3], 10)

	if (Number.isNaN(listenPort)) {
		console.error('Error: Invalid port')
		process.exit(1)
	}
} else {
	console.error('Usage: varley <project directory> [port]')
	console.error('  port: defaults to 8080')
	process.exit(1)
}

const path = require('path')
const fs = require('fs')
const vm = require('vm')
const { injectServerInto } = require('./src/server')
const express = require('express')
const staticFile = require('connect-static-file')
const WebSocket = require('ws')
const Game = require('./src/game')
const Lobby = require('./src/lobby')

const projectClientFile = path.join(projectPath, 'client.js')
const projectSharedFile = path.join(projectPath, 'shared.js')

// Prepare server environment
const serverEnvironment = global

injectServerInto(serverEnvironment)

/*exports.module = (name, args) => {
	if (['chat'].indexOf(name) === -1)
		throw new Error('Invalid module: ' + name)

	callbacks[name] = []

	require('./modules/' + name)(exports, args)
}*/

function runInThisOrExit(filename, allowNotFound) {
	let code

	try {
		code = fs.readFileSync(filename)
	} catch (error) {
		if (allowNotFound && error.code === 'ENOENT') {
			return
		}

		console.error(error)
		process.exit(1)
	}

	try {
		vm.runInThisContext(code, {
			filename,
			displayErrors: true,
		})
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}

function withDefault(value, defaultValue) {
	return value === undefined ? defaultValue : value
}

runInThisOrExit(projectSharedFile, true)
runInThisOrExit(path.join(projectPath, 'server.js'))
runInThisOrExit(path.join(__dirname, 'static', 'eshared.js'))

// App configuration
const tickRate = withDefault(serverEnvironment.TICK_RATE, 10)
const matchmaking = serverEnvironment.MATCHMAKING

function tick() {
	const start = Date.now()
	game.tick()
	const end = Date.now()
	setTimeout(tick, (1000 / tickRate) - (end - start))
}

let game

if (matchmaking === undefined) {
	game = new Game(serverEnvironment)
	game.single = true
	game.start()
} else {
	let [minPlayers, maxPlayers, minTime, maxTime] = matchmaking
	game = new Lobby(minPlayers, maxPlayers, minTime, maxTime, () => {
		return new Game(serverEnvironment)
	})
}

tick()

// Set up HTTP server
const app = express()
app.use('/client.js', staticFile(projectClientFile))
app.use('/shared.js', staticFile(projectSharedFile))
app.use(express.static(__dirname + '/static'))
app.use(express.static(__dirname + '/modules'))
app.use(express.static('resources'))

const server = require('http').createServer(app)

// Attach WebSocket service
const wss = new WebSocket.Server({ server })
let nextWS = 0
wss.on('connection', ws => {
	ws.id = nextWS++
	game.connect(ws)
	ws.on('message', msg => game.message(ws, msg))
	ws.on('close', () => game.disconnect(ws))
})

// Start listening
server.listen(listenPort, () => console.log(`Varley running on port ${listenPort}!`))
