/**
 * Created by Administrator on 2017/7/10 0010.
 */
var path = require('path')
var wx = require('./index')
var wechatApi = wx.getWechat() // 引入设定的api方法
var movieApi = require('../app/api/movie')
exports.reply = async(ctx, next) => {
    var message = ctx.state.wxMsg
    if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
            if (message.EventKey) {
                console.log('扫描二维码  你的key：' + message.EventKey + ' ' + message.ticket)
            }
            ctx.body = '谢谢你订阅了Chan的订阅号\n' +
                '输入1可以回复一段文字\n' +
                '输入github回复作者github\n' +
                '输入电影名字，进行查询搜索\n' +
                '也可以通过 \<a href="http://www.alicxw.top/wechat/movie"\>语音进行查询\<\/a\>'
        }
        // else if (message.Event === 'unsubscribe') {
        //     console.log('取消关注了')
        //     ctx.body = ''
        // } else if (message.Event === 'LOCATION') {
        //     ctx.body = '你的位置是：  ' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
        else if (message.Event === 'CLICK') {
            var text
            if (message.EventKey === 'click_help') {
                text = '谢谢你订阅了Chan的订阅号\n' +
                    '输入1可以回复一段文字\n' +
                    '输入github回复作者github\n' +
                    '输入电影名字，进行查询搜索\n' +
                    '也可以通过 \<a href="http://www.alicxw.top/movie"\>语音进行查询\<\/a\>'
            } else if (message.EventKey === 'click_mail') {
                text = 'wb_cxw@163.com'
            } else if (message.EventKey === 'click_top_movie') {
                var movies = await movieApi.findHot(5)
                text = []
                movies.forEach(movie => {
                    text.push({
                        title: movie.title,
                        description: movie.title,
                        picUrl: movie.poster,
                        url: 'http://www.alicxw.top/wechat/jump/' + movie._id
                    })
                })
            } else if (message.EventKey === 'click_comment') {
                var userName = message.FromUserName
                var movie = await movieApi.findHaveComment(userName)
                if (typeof(movie) === 'string') {
                    text = movie
                } else {
                    text = [{
                        title: movie.title,
                        description: movie.title,
                        picUrl: movie.poster,
                        url: 'http://www.alicxw.top/wechat/jump/' + movie._id
                    }]
                }
            } else {
                text = '你点击了: ' + message.EventKey
            }
            console.log(text)
            ctx.body = text
            // 若有子菜单是不能辨识到的
        }
        // } else if (message.Event === 'SCAN') {
        //     console.log('关注后扫描二维码' + message.EventKey + ' ' + message.Ticket)
        //     ctx.body = '扫码即可xx'
        // } else if (message.Event === 'VIEW') {
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // } else if (message.Event === 'scancode_push') {
        //     console.log('扫码推送')
        //     console.log(message.ScanCodeInfo.ScanType)
        //     console.log(message.ScanCodeInfo.ScanResult)
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // } else if (message.Event === 'scancode_waitmsg') {
        //     console.log('扫码推送等待')
        //     console.log(message.ScanCodeInfo.ScanType)
        //     console.log(message.ScanCodeInfo.ScanResult)
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // } else if (message.Event === 'pic_sysphoto') {
        //     console.log('拍照')
        //     console.log(message.SendPicsInfo.PicList)
        //     console.log(message.SendPicsInfo.Count)
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // } else if (message.Event === 'pic_photo_or_album') {
        //     console.log('相册')
        //     console.log(message.SendPicsInfo.PicList)
        //     console.log(message.SendPicsInfo.Count)
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // } else if (message.Event === 'pic_weixin') {
        //     console.log('微信相册')
        //     console.log(message.SendPicsInfo.PicList)
        //     console.log(message.SendPicsInfo.Count)
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // } else if (message.Event === 'location_select') {
        //     console.log('地理位置')
        //     console.log(message.SendLocationInfo.Location_X)
        //     console.log(message.SendLocationInfo.Location_Y)
        //
        //     ctx.body = '菜单的链接如下： ' + message.EventKey
        // }
    } else if (message.MsgType === 'text') {  // 接收文本信息
        var content = message.Content
        var reply = '瞧你说的，我都不太明白，关于你说的' + content + '还真不了解' // 设置回复信息
        if (content === '1') {
            reply = '老妈赛高！'
        } else if (content === 'github' || content === 'Github') {
            reply = [{
                title: 'Chan的github',
                description: '记载了Chan的项目',
                picUrl: 'http://wx2.sinaimg.cn/mw690/a6bed985gy1fez5by7ihaj20ku0kuwgt.jpg',
                url: 'https://github.com/CHANxw'
            }, {
                title: 'Chan的github',
                description: '记载了Chan的项目',
                picUrl: 'http://wx2.sinaimg.cn/mw690/a6bed985gy1fez5by7ihaj20ku0kuwgt.jpg',
                url: 'https://github.com/CHANxw'
            }]
        } else {
            var movies = await movieApi.searchByName(content)
            if (!movies || movies.length === 0) {
                movies = await movieApi.searchByDouBan(content)
            }
            if (movies && movies.length > 0) {
                reply = []
                movies = movies.slice(0, 5) // 限制5条
                movies.forEach(movie => {
                    reply.push({
                        title: movie.title,
                        description: movie.title,
                        picUrl: movie.poster,
                        url: 'http://www.alicxw.top/wechat/jump/' + movie._id
                    })
                })
            } else {
                reply = '没有查询到关于' + content + '的相关电影'
            }
        }
        console.log(reply)
        ctx.body = reply

    } else if (message.MsgType === 'image') { // 接收图片信息
        ctx.body = {
            type: 'image',
            mediaId: message.MediaId
        }
    } else if (message.MsgType === 'location') { // 接收地理位置信息
        ctx.body = '位置上传成功'
    } else if (message.MsgType === 'voice') {
        var voiceText = message.Recognition
        var movies = await movieApi.searchByName(voiceText)
        if (!movies || movies.length === 0) {
            movies = await movieApi.searchByDouBan(voiceText)
        }
        if (movies && movies.length > 0) {
            var reply = []
            movies = movies.slice(0, 5) // 限制5条
            movies.forEach(movie => {
                reply.push({
                    title: movie.title,
                    description: movie.title,
                    picUrl: movie.poster,
                    url: 'http://www.alicxw.top/wechat/jump/' + movie._id
                })
            })
        } else {
            reply = '没有查询到关于' + voiceText + '的相关电影'
        }
        console.log(reply)
        ctx.body = reply
    }
    await next
}