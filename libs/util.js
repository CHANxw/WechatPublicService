/**
 * Created by Administrator on 2017/7/7 0007.
 */
var fs = require('fs')
var Promise = require('bluebird')
var crypto = require('crypto')
var sha1 = require('sha1')
exports.readFileAsync = function (fpath, encoding) {
    return new Promise(function (resolve, reject) {
        fs.readFile(fpath, encoding, function (err, content) {
            if (err) reject(err) // 错误则返回错误
            else resolve(content) // 正确则返回正确内容
        })
    })
}
exports.writeFileAsync = function (fpath, content) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(fpath, content, function (err) {
            if (err) reject(err) // 错误则返回错误
            else resolve() // 正确则返回正确内容
        })
    })
}
exports.sign = function (ticket, url) {
    var nonceStr = createNonce()
    var timestamp = createTimestamp()
    var signature = _sign(nonceStr, timestamp, ticket, url)
    return {
        nonceStr: nonceStr,
        timestamp: timestamp,
        signature: signature
    }
}
// js sdk 验证需要
// 随机字符串
var createNonce = () => {
    return Math.random().toString(36).substr(2, 15)
}
// 时间戳
var createTimestamp = () => {
    return parseInt(new Date().getTime() / 1000, 10) + ''
}
var _sign = function (nonceStr, timestamp, ticket, url) {
    var param = [
        'noncestr=' + nonceStr,
        'timestamp=' + timestamp,
        'jsapi_ticket=' + ticket,
        'url=' + url,
    ]
    var str = param.sort().join('&')
    var shasum = crypto.createHash('sha1')
    shasum.update(str)
    return shasum.digest('hex')
    console.log(shasum)
}