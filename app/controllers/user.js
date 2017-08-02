// 负责用户信息交互
var User = require('../models/user')

exports.signup = async(ctx, next)=> {
    var _user = ctx.request.body.user
    // 查找有无重复
    var user = await User.findOne({name: _user.name}).exec()
    if (user) {
        console.log('用户名重复')
        ctx.redirect('/')  // 账号存在就返回首页
    } else {
        user = await new User(_user).save()
        console.log('有新注册用户： ' + user.name)
        ctx.session.user = user
        ctx.redirect('/')
    }
}
// user signin
exports.signin = async(ctx)=> {
    var _user = ctx.request.body.user
    var name = _user.name
    var password = _user.password
    var user = await User.findOne({name: name}).exec()
    if (!user) {
        await ctx.redirect('/signin')
    }
    var truely = await user.comparePassword(password)
    if (truely) {
        ctx.session.user = user
        console.log(user.name + '登陆----')
        ctx.redirect('/')
    } else {
        ctx.redirect('/signin')
        console.log('Password is not true')
    }
}
// user logout
exports.logout = async(ctx)=> {
    delete ctx.session.user
    ctx.redirect('/')
}
// admin/userlist
exports.list = async(ctx)=> {
    var users = await User
        .find({})
        .sort('meta.updateAt')
        .exec()
    await ctx.render('pages/userList', {
        title: '用户列表',
        users: users
    })
}
// show signin
exports.showSignin = async(ctx)=> {
    await ctx.render('pages/signin', {
        title: '登录页面',
    })
}
// show signup
exports.showSignup = async(ctx)=> {
    await ctx.render('pages/signup', {
        title: '注册页面',
    })
}
// 用户登录要求设置
exports.signinRequired = async(ctx, next)=> {
    var user = ctx.session.user
    if (!user) {
        return ctx.redirect('/signin')
    }
    await next(ctx) // 通过就执行下一个命令
}
// 用户权限要求设置midware for user
exports.adminRequired = async(ctx, next)=> {
    var user = ctx.session.user
    if (user.role <= 10) {
        return ctx.redirect('/')
    }
    await next(ctx) // 通过就执行下一个命令
}
