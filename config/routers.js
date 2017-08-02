'use strict'
// 同目录下的wechat.txt和wechat_ticket.txt分别保存 access-token和 ticket用的
var Index = require('../app/controllers/index') // 首页交互
var User = require('../app/controllers/user') // 用户信息交互
var Movie = require('../app/controllers/movie') // 电影信息交互
var Comment = require('../app/controllers/comment') // 评论信息交互
var Classify = require('../app/controllers/classify') // 分类信息交互
var Game = require('../app/controllers/game')
var Wechat = require('../app/controllers/wechat')
module.exports = function (router) {
    router.get('/wechat/movie', Game.find)
    router.get('/wx', Wechat.hear)
    router.post('/wx', Wechat.hear)
    router.get('/wechat/jump/:id', Game.jump)
    router.get('/wechat/openId/:id', Game.getOpenId)
    router.get('/wechat/movie/:id', Game.detail)
    router.get('/wechat/change', Game.change)
// views/index
    router.get('/', Index.index)

// views/list 电影列表
    router.get('/admin/movie/list', User.signinRequired, User.adminRequired, Movie.list)
// views/detail 详情页
    router.get('/movie/:id', Movie.detail)
// views/admin录入页
    router.get('/admin/movie/new', User.signinRequired, User.adminRequired, Movie.new)
// POST的新添加的movie信息
    router.post('/admin/movie', User.signinRequired, User.adminRequired, Movie.save)
//admin update movie 电影信息更新
    router.get('/admin/movie/update/:id', User.signinRequired, User.adminRequired, Movie.update)
// delete movie 删除电影页
    router.delete('/admin/movie/list', User.signinRequired, User.adminRequired, Movie.del)


// user signup 注册
    router.post('/user/signup', User.signup)
// user signin 登入
    router.post('/user/signin', User.signin)
// user signup 注册
    router.get('/signup', User.showSignup)
// user signin 登入
    router.get('/signin', User.showSignin)
// user logout 登出
    router.get('/logout', User.logout)
// admin/userlist 用户列表
    router.get('/admin/user/list', User.signinRequired, User.adminRequired, User.list)


// comment 评论
// POST的新添加的comment信息
    router.post('/user/comment', User.signinRequired, Comment.save)

// 后台分类
    // 添加
    router.get('/admin/classify/new', User.signinRequired, User.adminRequired, Classify.new)
    // 保存
    router.post('/admin/classify', User.signinRequired, User.adminRequired, Classify.save)
    router.get('/admin/classify/list', User.signinRequired, User.adminRequired, Classify.list)

// 查询返回
    router.get('/results', Index.search)


}
