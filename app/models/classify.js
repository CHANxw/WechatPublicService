var mongoose = require('mongoose')
var ClassifySchema = require('../schemas/classify')
var Classify = mongoose.model('Classify', ClassifySchema)
module.exports = Classify