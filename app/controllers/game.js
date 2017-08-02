'use strict'
// 配置页面模板
var Movie = require('../models/movie')
var movieApi = require('../api/movie')
var User = require('../models/user')
var Comment = require('../models/comment')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var wx = require('../../wx/index')
var util = require('../../libs/util')
exports.find = async(ctx, next) => { // 在g中间件之前在创建一个中间件，用来输出一个html文件
    var wechatApi = wx.getWechat()
    var data = await wechatApi.fetchAccessToken()
    var access_token = data.access_token
    var ticketData = await wechatApi.fetchTicket(access_token)
    var ticket = ticketData.ticket
    var url = ctx.href
    var params = util.sign(ticket, url)
    await ctx.render('wechat/game', params)
}
exports.jump = async(ctx, next) => { // 在g中间件之前在创建一个中间件，用来输出一个html文件
    var id = ctx.params.id
    var redirect = 'http://www.alicxw.top/wechat/openId/' + encodeURIComponent(id)
    // url 中state 是传递参数(传啥看心情)，这里传递movie的id过去
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?' +
        'appid=' + wx.config.wechat.appID +
        '&redirect_uri=' + redirect +
        '&response_type=code&scope=snsapi_base&state=' + id +
        '#wechat_redirect '
    console.log(url)
    await ctx.redirect(url)
}
exports.getOpenId = async(ctx, next) => {
    var movieId = ctx.params.id
    var code = ctx.query.code
    var openUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + wx.config.wechat.appID +
        '&secret=' + wx.config.wechat.appSecret +
        '&code=' + code +
        '&grant_type=authorization_code'
    var response = await request({
        url: openUrl,
        json: true
    }).then(res => {
        return res.body
    })
    var newOpenId = response.openid
    var user = await User.findOne({openId: newOpenId}).exec()
    if (!user) {
        user = await User({openId: newOpenId}).save()
    }
    ctx.session.user = user
    ctx.state.user = user
    await ctx.redirect('/wechat/movie/' + movieId)
}
exports.detail = async(ctx, next) => {
    var id = ctx.params.id
    console.log('---id:' + id)
    var wechatApi = wx.getWechat()
    var data = await wechatApi.fetchAccessToken()
    var access_token = data.access_token
    var ticketData = await wechatApi.fetchTicket(access_token)
    var ticket = ticketData.ticket
    var url = ctx.href
    var params = util.sign(ticket, url)
    var movie = await movieApi.searchById(id)
    await Movie.update({_id: id}, {$inc: {pv: 1}})
    var comments = await Comment
        .find({movie: id})
        .populate('from reply.from reply.to', 'name')
        .exec()
    params.movie = movie
    params.comments = comments || []
    await ctx.render('wechat/movie', params)
}
exports.change = async(ctx, next) => {
    console.log('修改名字中')
    var name = ctx.query.name
    var userName = await User.findOne({name: name}).exec()
    if (userName) {
        ctx.body = {success: 0}
    } else {
        console.log(name)
        var user = ctx.session.user
        await User.update({openId: user.openId}, {name: name}).exec()
        user = await User.findOne({openId: user.openId}).exec()
        ctx.session.user = user
        console.log(user)
        ctx.state.user = user
        ctx.body = {success: 1}
    }
}