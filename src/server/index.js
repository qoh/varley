'use strict'

const Sheet = require('./sheet')
const imageSize = require('image-size')

module.exports.injectServerInto = environment => {
	environment.Sheet = Sheet
	environment.sizeOf = imageSize
}