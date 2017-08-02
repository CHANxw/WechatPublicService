// 负责评论信息相关的交互
var Classify = require('../models/classify')

// POST的新添加的classify信息
exports.save = async(ctx, next)=> {
    var _classify = ctx.request.body.classify
    // var name = _classify.name
    var classify = await Classify.findOne({name: _classify.name})
    if (!classify) {
        await new Classify(_classify).save()
    }
    await ctx.redirect('/admin/classify/list')
}
exports.new = async(ctx, next)=> {
    await ctx.render('pages/classifyAdmin', {
        title: '分类录入页',
        classify: {}
    })
}
exports.list = async(ctx, next)=> {
    var classifys = await Classify
        .find({})
        .sort('meta.updateAt')
        .exec()
    await ctx.render('pages/classifyList', {
        title: '分类列表',
        classify: classifys
    })
}
