WechatPublicService
=============
利用nodeJS完成微信公众号开发，实现电影查询用户评论等功能
通过将MovieServer的express框架改造升级成Koa2，实现PC后台控制和微信公众号查询、评论等功能

主要依赖
=============
 + 基于koa2.0框架 async/await方法的应用
 + 使用pug (原jade) 模板引擎完成页面渲染
 + 使用koa-session 实现页面用户信息保存及持久化
 + 使用koa-router 完成页面路由
 + 使用xml2js 等数据格式转化模块完成xml的json化
 + 使用ejs引擎 完成对xml格式输出
 + 使用了sha1等加密依赖模板完成公众号接入信息验证等

项目功能
=============
 + 完成公众号接入，对有效信息进行保存
 + 继承MovieServer项目中在PC端实现的完成的用户注册、评论等功能
 + 通过mongoose完成电影、用户等数据信息的存储
 + 对微信公众号进行开发，实现依据用户输入内容返回相应信息，完成电影查询，用户评论等功能
 + 对微信公众号开发中常见的api进行封装，可以依据需求调用方法
 + 回复模块也单独抽离，可以在原来的基础上进行其他回复需求

项目结构
=============
 + app.js入口文件
 + app 保存数据库调用及前端视图渲染
 + config 路由文件及认证信息数据保存地址
 + libs 公共方法
 + static 静态资源文件
 + wechat 微信相关业务代码
 + wx 配置信息 开发者信息配置、菜单配置、回复配置

项目运行及编译
=============
```
# 克隆项目.
$ git clone https://github.com/CHANxw/WechatPublicService.git

# 安装依赖
$ npm install

# 到微信公众号开发文档中设置配置信息

# 修改项目中开发者配置信息，文件路径 wx/index 中config.wechat中的信息

# 到项目目录中运行项目
$ node app
```
有服务器可以直接在服务器上使用，然后访问地址就是公网域名
也可以在网上搜索将本机IP映射成外网域名

在接入公众号时遇到一些问题--可能只有自己才能理解的总结哈哈 from [简书](http://www.jianshu.com/p/778d4e78b141)

关于个人
--------
[简书](http://www.jianshu.com/u/e73691f972bb) + [github](https://github.com/CHANxw) + [邮箱: wb_cxw@163.com](http://mail.163.com/)
