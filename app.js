'use strict'
var Koa = require('koa') // 比express更适合复杂的交互场景
var fs = require('fs')
var serve = require('koa-static')
var Promise = require('bluebird')
var mongoose = require('mongoose')
mongoose.Promise = Promise
var dbUrl = 'mongodb://localhost/movie'
var wx = require('./wx/index')
var game = require('./app/controllers/game')
var session = require('koa-session')
var koaBody = require('koa-body')
var menu = require('./wx/menu')
var wechatApi = wx.getWechat()
var Router = require('koa-router')
var app = new Koa()
var User = require('./app/models/user')
// 渲染模块
var views = require('koa-views')
mongoose.connect(dbUrl, {useMongoClient: true}) // 连接数据库
wechatApi.deleteMenu().then(function () {
    return wechatApi.createMenu(menu)
})
app.use(async (ctx, next)=>{
    ctx.state.moment= require('moment')
    await next()
})
app.use(views(__dirname + '/app/views', {
    extension: 'pug'
}))
app.keys = ['movie']
app.use(session(app))
app.use(async(ctx, next) => {
    var user = ctx.session.user
    if (user && user.name) {
        user = await User.findOne({name: user.name}).exec()
        ctx.state.user = user || null
    }
    await next()
})
app.use(serve(__dirname +'/static')) // 静态资源配置
var router = new Router()
app.use(koaBody({multipart: true}))
app
    .use(router.routes())
    .use(router.allowedMethods())
require('./config/routers')(router)
app.listen(80)
console.log('listening:80')
