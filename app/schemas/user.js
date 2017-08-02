// 用户 模式配置
var mongoose = require('mongoose')  // 建模工具
var bcrypt = require('bcrypt-nodejs') // 加密--随机产生盐然后拼接传入的密码进行更高的加密
// 盐--就是干扰原来密码多加的干扰部分
var SALT_WORK_FACTOR = 10  // 设置加密强度
var UserSchema = new mongoose.Schema({  // 模式定义传入的数据类型
    name: {
        type: String,
        default: '游客',
    },
    password: String, // 密码要进行哈希计算--不可逆
    // role中数值不同表示不同的权限
    // 0 普通用户
    role: {
        type: Number,
        default: 0
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
UserSchema.pre('save', function (next) {
    var user = this
    if (this.inNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    } else {
        this.meta.updateAt = Date.now()
    }
    if (user.password) {
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) return next(err) // 有错误就带入下一个流程
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) return next(err)
                user.password = hash
            })
        })// 两个参数一个是盐的复杂程度，一个是回调可以返回盐
    }
    next()
})
UserSchema.methods = {  // 实例方法
    comparePassword: function (_password, cb) {
        var password = this.password
        return function (cb) {
            bcrypt.compare(_password, password, function (err, truely) {  // bcrypt的compare方法
                cb(err, truely) // 成功则返回回调参数
            })
        }
    }
}
UserSchema.statics = {   // 设置静态方法
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
module.exports = UserSchema