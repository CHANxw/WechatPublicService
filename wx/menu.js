/**
 * Created by Administrator on 2017/7/12 0012.
 */
// type值是固定，表示事件类型
// 二级菜单最多5个
module.exports = {
    'button': [{  // 一级菜单
        'name': '电影',
        'type': 'click',
        'sub_button': [{
            'name': '最热门',
            'type': 'click',
            'key': 'click_top_movie'
        },{
            'name': '最近评论',
            'type': 'click',
            'key': 'click_comment'
        }],
    },{
        'name': '作者相关',
        'sub_button': [{  // 二级菜单
            'name': 'Github',
            'type': 'view',  // 跳转url
            'url': 'https://github.com/CHANxw'
        },{
            'name': '简书',
            'type': 'view',  // 跳转url
            'url': 'http://www.jianshu.com/u/e73691f972bb'
        },{
            'name': '邮箱',
            'type': 'click',  // 跳转url
            'key': 'click_mail'
        }],
    },{
        'name': 'help',
        'type': 'click',
        'key': 'click_help',
    }]
}