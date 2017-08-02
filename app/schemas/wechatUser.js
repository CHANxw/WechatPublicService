// 用户 模式配置
var mongoose = require('mongoose')  // 建模工具

var WechatUserSchema = new mongoose.Schema({  // 模式定义传入的数据类型
    name: {
        type:String,
        default: '游客'
    },
    openId: String,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        },
    }
})
// 添加一个方法来
WechatUserSchema.pre('save', function (next) {
    if (this.inNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    } else {
        this.meta.updateAt = Date.now()
    }
    next()
})
WechatUserSchema.statics = {   // 设置静态方法
    fetch: function (cb) {
        return this
            .find({})
            .sort('meta.updateAt')
            .exec(cb)
    },
    // cb == callback 回调
    findById: function (id, cb) {
        return this
            .findOne({_id: id})
            .exec(cb)
    }
}
module.exports = WechatUserSchema