var path = require('path') // 路径文件
var util = require('../libs/util.js')
var wechat_file = path.join(__dirname, '../config/wechat.txt')
var wechat_ticket_file = path.join(__dirname, '../config/wechat_ticket.txt')
var Wechat = require('../wechat/wechat')

var config = {    // 设置配置信息
    wechat: {
        appID: '',  // 填写微信开发者信息在此处
        appSecret: '',
        token: '',
        getAccessToken: function () {
            return util.readFileAsync(wechat_file)
        },
        saveAccessToken: function (data) {
            var data = JSON.stringify(data)
            return util.writeFileAsync(wechat_file, data)
        },
        getTicket: function () {
            return util.readFileAsync(wechat_ticket_file)
        },
        saveTicket: function (data) {
            var data = JSON.stringify(data)
            return util.writeFileAsync(wechat_ticket_file, data)
        }
    }
}
exports.getWechat = function () {
    var wechatApi = new Wechat(config.wechat)
    return wechatApi
}
exports.config = config