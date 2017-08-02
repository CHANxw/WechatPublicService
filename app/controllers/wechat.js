'use strict'
var wx = require('../../wx/index')
var wechat = require('../../wechat/g')
var reply = require('../../wx/reply')
exports.hear = async(ctx, next) => {
    ctx.middle = wechat(wx.config.wechat, reply.reply) //添加中间件
    await ctx.middle(ctx, next) // 等待响应并执行，记得传入ctx
}