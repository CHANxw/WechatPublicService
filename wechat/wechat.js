/**
 * Created by Administrator on 2017/7/9 0009.
 */
'use strict'
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var util = require('./util')
var _ = require('lodash')
var fs = require('fs')
var prefix = 'https://sz.api.weixin.qq.com/cgi-bin/' // 微信服务器请求地址的公共头
var mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/' // 获取二维码的服务器请求地址的公共头
var semanticApi = 'https://api.weixin.qq.com/semantic/semproxy/search?'
var api = {
    accessToken: prefix + 'token?grant_type=client_credential',
    temporary: { // 临时素材
        upload: prefix + 'media/upload?',  // 上传
        fetch: prefix + 'media/get?'
    },
    permanent: { // 永久素材
        upload: prefix + 'material/add_material?',
        uploadNews: prefix + 'material/add_news?', // 上传图文列表
        uploadImg: prefix + 'media/uploadimg?',  // 上传图片并返回图片url可以在文本消息直接使用
        fetch: prefix + 'material/get_material?', // 获取素材
        del: prefix + 'material/del_material?',  // 删除素材
        update: prefix + 'material/update_news?', // 更新素材
        count: prefix + 'material/get_materialcount?',  // 获取素材总数 分类型
        fetchList: prefix + 'material/batchget_material?',  // 获取素材列表

    },
    tag: {
        create: prefix + 'tags/create?', // 创建标签
        fetch: prefix + 'tags/get?', // 获取所有已创建的标签  返回 id,name,count
        update: prefix + 'tags/update?', // 编辑标签  返回修改成功与否
        del: prefix + 'tags/delete?', // 删除标签 通过标签id删除
        fetchLists: prefix + 'user/tag/get?', // 获取单个标签下粉丝列表
        addTag: prefix + 'tags/members/batchtagging?', // 给用户组添加标签
        removeTag: prefix + 'tags/members/batchuntagging?', // 移除用户上的标签
        fetchUserTag: prefix + 'tags/getidlist?',  // 获取单个用户上的标签
    },
    user: {
        remark: prefix + 'user/info/updateremark?', // 设置备注名
        fetch: prefix + 'user/info?', // 获取用户基本信息
        fetchLists: prefix + 'user/info/batchget?', // 批量获取用户基本信息
        followLists: prefix + 'user/get?' // 获取关注列表
    },
    mass: {
        sendAll: prefix + 'message/mass/sendall?', // 依据标签群发
        sendOpenId: prefix + 'message/mass/send?',  // 依据openid列表群发
        del: prefix + 'message/mass/delete?', // 删除群发
        preview: prefix + 'message/mass/preview?', // 预览群发
        check: prefix + 'message/mass/get?', // 查询群发状态
    },
    menu: {
        create: prefix + 'menu/create?', // 创建菜单
        get: prefix + 'menu/get?', // 获取菜单信息  菜单有个性和默认两种
        del: prefix + 'menu/delete?', // 删除当前使用的自定义菜单。
        // 另请注意，在个性化菜单时，调用此接口会删除默认菜单及全部个性化菜单。
        addConditional: prefix + 'menu/addconditional?', // 创建个性化菜单
        delConditional: prefix + 'menu/delconditional?', // 删除个性化菜单,删除所有用del
        checkConditional: prefix + 'menu/trymatch?', // 测试个性化菜单匹配结果
        getCurrent: prefix + 'get_current_selfmenu_info?' // 获取自定义菜单配置
    },
    qrcode: {
        create: prefix + 'qrcode/create?', // 创建二维码
        show: mpPrefix + 'showqrcode?', // 获取二维码
    },
    shortUrl: {
        create: prefix + 'shorturl?' // 创建短链接
    },
    ticket: {
        get: prefix + 'ticket/getticket?', // 获取调用微信JS接口的临时票据
    }
}

function Wechat(opts) {
    this.appID = opts.appID
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken // 获取
    this.saveAccessToken = opts.saveAccessToken // 保存
    this.getTicket = opts.getTicket // 获取
    this.saveTicket = opts.saveTicket // 保存
    this.fetchAccessToken()
}
Wechat.prototype.fetchAccessToken = function () {
    var that = this
    if (this.access_token && this.expires_in) {
        if (this.isVaildAccessToken(this)) {
            return Promise.resolve(this)
        }
    }
    return this.getAccessToken()    // 使用promise方法
        .then(function (data) {  // 获取成功时
            try {
                data = JSON.parse(data)
            }
            catch (e) { // 获取失败时
                return that.updateAccessToken() // 更新
            }
            if (that.isVaildAccessToken(data)) { // 判断是否是有效值
                return Promise.resolve(data)     // 有效则返回data
            } else {
                return that.updateAccessToken()
            }
        })
        .then(function (data) {
            that.saveAccessToken(data)
            return Promise.resolve(data)
        })
}

Wechat.prototype.isVaildAccessToken = function (data) {
    if (!data || !data.access_token || !data.expires_in) {
        return false
    }
    var expires_in = data.expires_in
    var now = (new Date().getTime())

    if (now < expires_in) {
        return true
    }
    return false
}
Wechat.prototype.updateAccessToken = function () {
    var appID = this.appID
    var appSecret = this.appSecret
    var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        request({url: url, json: true}).then(function (res) { // 对http封装好的方法，向服务器发起请求
            var data = res.body
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000 // 提前20秒刷新，为了更好的体验效果
            data.expires_in = expires_in
            resolve(data)
        })
    })
}
// 获取ticket
Wechat.prototype.fetchTicket = function (accessToken) {
    var that = this
    if (this.access_token && this.expires_in) {
        if (this.isVaildAccessToken(this)) {
            return Promise.resolve(this)
        }
    }
    return this.getTicket()    // 使用promise方法
        .then(function (data) {  // 获取成功时
            try {
                data = JSON.parse(data)
            }
            catch (e) { // 获取失败时
                return that.updateTicket(accessToken) // 更新
            }
            if (that.isVaildTicket(data)) { // 判断是否是有效值
                return Promise.resolve(data)     // 有效则返回data
            } else {
                return that.updateTicket(accessToken)
            }
        })
        .then(function (data) {
            that.saveTicket(data)
            return Promise.resolve(data)
        })
}
// 更新ticket
Wechat.prototype.updateTicket = function (accessToken) {
    var url = api.ticket.get + 'access_token=' + accessToken + '&type=jsapi'
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        request({url: url, json: true}).then(function (res) { // 对http封装好的方法，向服务器发起请求
            var data = res.body
            var now = (new Date().getTime())
            var expires_in = now + (data.expires_in - 20) * 1000 // 提前20秒刷新，为了更好的体验效果
            data.expires_in = expires_in
            resolve(data)
        })
    })
}
// 判断ticket有效性
Wechat.prototype.isVaildTicket = function (data) {
    if (!data || !data.ticket || !data.expires_in) {
        return false
    }
    var expires_in = data.expires_in
    var now = (new Date().getTime())

    if (now < expires_in) {
        return true
    }
    return false
}
Wechat.prototype.uploadMaterial = function (type, material, permanent) {
    var that = this
    var form = {}
    var uploadUrl = api.temporary.upload
    if (permanent) {
        uploadUrl = api.permanent.upload
        _.extend(form, permanent)  // 令form继承permanent这个对象
    }
    if (type === 'pic') {      // 通过传入的类型确定url地址
        uploadUrl = api.permanent.uploadImg
    }
    if (type === 'news') {
        uploadUrl = api.permanent.uploadNews
        form = material
    } else {
        form.media = fs.createReadStream(material)  // 读取大文件，分段读取并返回data--这里就是获取文件就对了
    }
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = uploadUrl + 'access_token=' + data.access_token
                if (!permanent) {
                    url += '&type=' + type
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true // 返回需求
                }
                // 上传不同文件请求格式不同
                if (type === 'news') {
                    options.body = form
                } else {
                    options.formData = form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('Upload material fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.fetchMaterial = function (mediaId, type, permanent) {
    var that = this
    var fetchUrl = api.temporary.fetch
    if (permanent) {
        fetchUrl = api.permanent.fetch
    }
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = fetchUrl + 'access_token=' + data.access_token
                var form = {}
                var options = {
                    json: true, // 返回json
                }
                if (!permanent) {
                    url += '&media_id=' + mediaId
                    options.method = 'GET'
                } else {
                    form = {
                        media_id: mediaId,
                        access_token: data.access_token
                    }
                    options.method = 'POST'
                    options.body = form
                }
                options.url = url
                if (type === 'news' || type === 'video') {
                    request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                        var _data = res.body
                        if (_data) {
                            resolve(_data)
                        } else {
                            throw new Error('fetch Material fails')
                        }
                    })
                } else {
                    resolve(url)
                }
            })
            .catch(function (err) {
                reject(err)
            })
    })
}

Wechat.prototype.deleteMaterial = function (mediaId) {
    var that = this
    var form = {
        media_id: mediaId
    }
    var delUrl = api.permanent.del
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = delUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('Delete material fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.updateMaterial = function (mediaId, news) {
    var that = this
    var form = {
        media_id: mediaId
    }
    _.extend(form, news)
    var updateUrl = api.permanent.update
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = updateUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('Update material fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.countMaterial = function () {
    var that = this

    var countUrl = api.permanent.count
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = countUrl + 'access_token=' + data.access_token
                var options = {
                    method: 'GET',
                    url: url,
                    json: true, // 返回json
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('count material fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.fetchListMaterial = function (config) {
    var that = this

    config.type = config.type || 'image'
    config.offset = config.offset || 0
    config.count = config.count || 1

    var fetchListUrl = api.permanent.fetchList
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = fetchListUrl + 'access_token=' + data.access_token
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: config
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch List Material fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 标签start
Wechat.prototype.createTag = function (name) {
    var that = this
    var createUrl = api.tag.create
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = createUrl + 'access_token=' + data.access_token
                var form = {
                    tag: {
                        name: name
                    }
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('create Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.fetchTags = function () {
    var that = this
    var fetchUrl = api.tag.fetch
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = fetchUrl + 'access_token=' + data.access_token
                var options = {
                    url: url,
                    json: true, // 返回json
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.updateTag = function (id, name) {
    var that = this
    var updateUrl = api.tag.update
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = updateUrl + 'access_token=' + data.access_token
                var form = {
                    tag: {
                        id: id,
                        name: name
                    }
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('update Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.deleteTag = function (id) {
    var that = this
    var delUrl = api.tag.del
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = delUrl + 'access_token=' + data.access_token
                var form = {
                    tag: {
                        id: id,
                    }
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('delete Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.fetchListsTag = function (tagId, to) {
    var that = this
    var fetchListsUrl = api.tag.fetchLists
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = fetchListsUrl + 'access_token=' + data.access_token
                var form = {
                    tagid: tagId,
                    next_openid: to
                }
                var options = {
                    method: 'GET',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch list tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.addUserTag = function (openidList, tagId) {
    var that = this
    var addTagUrl = api.tag.addTag
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = addTagUrl + 'access_token=' + data.access_token
                var form = {
                    tagid: tagId,
                    openid_list: openidList
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('addUser tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.removeUserTag = function (openidList, tagId) {
    var that = this
    var removeTagUrl = api.tag.removeTag
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = removeTagUrl + 'access_token=' + data.access_token
                var form = {
                    tagid: tagId,
                    openid_list: openidList
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('removeUser Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.getUserTag = function (openId) {
    var that = this
    var fetchUserTagUrl = api.tag.fetchUserTag
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = fetchUserTagUrl + 'access_token=' + data.access_token
                var form = {
                    openid: openId
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('getUser Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 用户start
Wechat.prototype.remarkUser = function (openId, remark) {
    var that = this
    var remarkUserUrl = api.user.remark
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = remarkUserUrl + 'access_token=' + data.access_token
                var form = {
                    openid: openId,
                    remark: remark
                }
                var options = {
                    method: 'POST',
                    url: url,
                    json: true, // 返回json
                    body: form
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('remark User fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.fetchUsers = function (openIds, lang) {
    var that = this
    lang = lang || 'zh_CN'
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url,form
                var options = {}
                if (_.isArray(openIds)) {
                    url = api.user.fetchLists + 'access_token=' + data.access_token
                    form = {
                        user_list: openIds
                    }
                    options.method = 'POST'
                    options.body = form
                } else {
                    url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang
                }
                options.json = true
                options.url = url

                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch Users fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
//  获取关注用户的用户列表
Wechat.prototype.fetchFollowUsers = function (nextOpenId) {
    var that = this
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.user.followLists + 'access_token=' + data.access_token
                if (nextOpenId) {
                    url += '&next_openid=' + nextOpenId
                }
                var options = {
                    url: url,
                    json: true
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('fetch Follow Users fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// mass start 群发
Wechat.prototype.sendByTag = function (type, message, tagId, canSend) { // 类型，消息，标签ID，是否能转载
    var that = this
    var msg = {
        filter: {},
        msgtype: type
    }
    if (tagId) {  // 没有指定标签ID则是发送给所有人
        msg.filter = {
            is_to_all: false,
            tag_id: tagId
        }
    } else {
        msg.filter.is_to_all = true
    }
    if (type === 'mpnews') {
        msg.filter.send_ignore_reprint = canSend || 0
    }
    msg[type] = message
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.mass.sendAll + 'access_token=' + data.access_token

                var options = {
                    url: url,
                    json: true,
                    method: 'POST',
                    body: msg
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('send By Tag fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 依据openid列表进行群发
Wechat.prototype.sendByOpenIds = function (type, message, openIds, canSend) { // 类型，消息，标签ID， 是否能转载
    var that = this
    var msg = {
        touser: openIds,  // openId最少两个
        msgtype: type
    }
    if (type === 'mpnews') {
        msg.filter.send_ignore_reprint = canSend || 0
    }
    msg[type] = message
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.mass.sendOpenId + 'access_token=' + data.access_token

                var options = {
                    url: url,
                    json: true,
                    method: 'POST',
                    body: msg
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('send By OpenIds fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 删除群发(可以指定其中的文章)
Wechat.prototype.deleteMass = function (msgId, index) { // msgId删除群发的文章id  index删除这次群发下的指定文章，0表示全删
    var that = this
    var msg = {
        msg_id: msgId,
    }
    if (!index) {
        msg.article_idx = 0
    } else {
        msg.article_idx = index
    }
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.mass.del + 'access_token=' + data.access_token

                var options = {
                    url: url,
                    json: true,
                    method: 'POST',
                    body: msg
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('delete mass fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 预览群发
Wechat.prototype.previewMass = function (type, message, openId) {
    var that = this
    var msg = {
        touser: openId,  // openId最少两个
        msgtype: type
    }
    msg[type] = message
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.mass.preview + 'access_token=' + data.access_token

                var options = {
                    url: url,
                    json: true,
                    method: 'POST',
                    body: msg
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('preview Mass fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 查询群发状态
Wechat.prototype.checkMass = function (msgId) {
    var that = this
    var msg = {
        msg_id: msgId
    }
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.mass.check + 'access_token=' + data.access_token

                var options = {
                    url: url,
                    json: true,
                    method: 'POST',
                    body: msg
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('Check Mass fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// Menu start
// 创建菜单
// 查询群发状态
Wechat.prototype.createMenu = function (menu) {
    var that = this
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.menu.create + 'access_token=' + data.access_token
                var options = {
                    url: url,
                    json: true,
                    method: 'POST',
                    body: menu
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('create Menu fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 获取/查询菜单信息
Wechat.prototype.getMenu = function () {
    var that = this
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.menu.get + 'access_token=' + data.access_token
                var options = {
                    url: url,
                    json: true,
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('get Menu fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.deleteMenu = function () {
    var that = this
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.menu.del + 'access_token=' + data.access_token
                var options = {
                    url: url,
                    json: true,
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('delete Menu fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 获取当前菜单配置
Wechat.prototype.getCurrentMenu = function () {
    var that = this
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.menu.getCurrent + 'access_token=' + data.access_token
                var options = {
                    url: url,
                    json: true,
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('get Current Menu fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 创建二维码
Wechat.prototype.createQrcode = function (qr) {
    var that = this
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.qrcode.create + 'access_token=' + data.access_token
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: qr
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('create Qrcode fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 获取二维码
Wechat.prototype.showQrcode = function (ticket) {
    return api.qrcode.show + 'ticket=' + encodeURI(ticket)
}
// 创建短链接
Wechat.prototype.createShortUrl = function (url) {
    var that = this
    var msg = {
        action: long2short,
        long_url: url
    }
    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = api.shortUrl.create + 'access_token=' + data.access_token
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: msg
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('create ShortUrl fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
// 创建语义识别请求
Wechat.prototype.semantic = function (semanticData) {
    var that = this

    return new Promise(function (resolve, reject) {  // 判断request 方法成功和失败时的操作
        that
            .fetchAccessToken()
            .then(function (data) {
                var url = semanticApi + 'access_token=' + data.access_token
                semanticData.appid = data.appID
                var options = {
                    method: 'POST',
                    url: url,
                    json: true,
                    body: semanticData
                }
                request(options).then(function (res) { // 对http封装好的方法，向服务器发起请求
                    var _data = res.body
                    if (_data) {
                        resolve(_data)
                    } else {
                        throw new Error('create ShortUrl fails')
                    }
                })
            })
            .catch(function (err) {
                reject(err)
            })
    })
}
Wechat.prototype.reply = function () {
    console.log('------------发送请求-------------')
    var content = this.body
    var message = this.state.wxMsg
    var replyXml = util.tpl(content, message)

    this.status = 200
    this.type = 'application/xml'
    this.body = replyXml
}
module.exports = Wechat
