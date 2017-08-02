var mongoose = require('mongoose')
var WechatUserSchema = require('../schemas/wechatUser')
var WechatUser = mongoose.model('WechatUser', WechatUserSchema)
module.exports = WechatUser