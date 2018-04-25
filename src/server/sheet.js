'use strict'

let A = 0
let S = 1

function Sheet(image, width, height) {
  this.width = width
  this.height = height

  let dimensions = sizeOf('resources/' + image)
  this.columns = dimensions.width / this.width
  this.rows = dimensions.height / this.height

  if (this.rows % 1 != 0 || this.columns % 1 != 0)
    throw new Error('Sheet(' + image + ', ' + this.width + ', ' + this.height + ') has invalid width/height!')
}

module.exports = (image, width, height) => new Sheet(image, width, height)