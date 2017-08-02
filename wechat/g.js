/**
 * Created by Administrator on 2017/7/7 0007.
 */
//g 为generator node 中间件
'use strict'
var sha1 = require('sha1') // 一个加密模块
var getRawBody = require('raw-body')
var Wechat = require('./wechat')
var util = require('./util')
//  定义一个构造函数来更新储存access_token ，凭据，每个只能使用2h，所以需要更新

// 下面地址是请求微信服务器获取凭据等，为了让原型方法中的url是可以配置的，所以单独写一个变量来



module.exports = function (opts, handler) {
    var wechat = new Wechat(opts)
    return async(ctx, next) => {
        var token = opts.token
        console.log('------query-------')
        console.log(ctx.query)
        var signature = ctx.query.signature
        var nonce = ctx.query.nonce
        var timestamp = ctx.query.timestamp
        var echostr = ctx.query.echostr
        var str = [nonce, timestamp, token].sort().join('')
        var sha = sha1(str)
        if (ctx.method === 'GET') {
            console.log('接收get方法')
            console.log('-----------')
            if (sha === signature) {
                ctx.body = echostr + ''
            } else {
                ctx.body = 'wrong'
            }
        } else if (ctx.method === 'POST') {
            console.log('接收post方法')
            console.log('-----------')
            if (sha !== signature) { // 先验证是不是微信服务器的请求
                ctx.body = 'wrong'
                return false
            }
            // 微信服务器POST的请求发送的数据不是html也不是json，而是xml
            var data = await getRawBody(ctx.req, {
                length: ctx.req.length,
                limit: '1mb', // 限制发送的体积大小
                encoding: ctx.req.charset
            })
            var content = await util.parseXMLAsync(data)
            var message = await util.formatMessage(content.xml)
            console.log(message)
            ctx.state.wxMsg = message // 把解析好的message储存 koa的特有方法就是存在state中

            await handler(ctx, next)  // 让业务处理储存好的message

            wechat.reply.call(ctx)
        }
    }
}

