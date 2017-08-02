// 负责评论信息相关的交互
var Comment = require('../models/comment')

// POST的新添加的comment信息
exports.save = async(ctx, next)=> {
    var _comment = ctx.request.body.comment
    var movieId = _comment.movie
    var comment
    console.log('--------comment------------')
    console.log(_comment)
    console.log('--------------------')
    if (_comment.cid) {
        comment = await Comment.findOne({_id: _comment.cid})
        var reply = {
            from: _comment.from,
            to: _comment.tid,
            content: _comment.content,
        }
        comment.reply.push(reply)

    } else {
        comment = await new Comment(_comment)
    }
    await comment.save()
    // ctx.redirect('/movie/' + movieId)
    ctx.body = {success: 1}
}