var mongoose = require('mongoose')  // 建模工具
var mongoosePages = require('mongoose-pages') // 分页插件

var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId  // 获取特有id
var MovieSchema = new Schema({  // 模式定义传入的数据类型
    director: String,
    title: String,
    language: String,
    country: String,
    pv: {  // 流量观察
        type: Number,
        default: 0
    },
    genres: [String],
    douBanId: String,
    classify: {
        type: ObjectId,
        ref: 'Classify'
    },
    flash: String,
    summary: String,
    poster: String,
    year: Number,
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
MovieSchema.pre('save', function (next) {
    if (this.inNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    } else {
        this.meta.updateAt = Date.now()
    }
    next()
})

MovieSchema.statics = {
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
mongoosePages.skip(MovieSchema)

module.exports = MovieSchema