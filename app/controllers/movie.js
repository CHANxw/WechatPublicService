'use strict'
// 负责电影信息相关的交互
var Movie = require('../models/movie')
var Comment = require('../models/comment')
var Classify = require('../models/classify')
var _ = require('lodash')
var fs = require('fs')
var path = require('path')

// views/list
exports.list = async(ctx, next)=> {
    var classify = ctx.query.classify
    console.log(classify)
    if (classify) {
        var classifyMovies = await Classify
            .findOne({_id: classify})
            .populate('movies', 'title year country director pv') // 获取movie下的数据然后限制个数
            .exec()
        await ctx.render('pages/list', {
            title: classifyMovies.name,
            movies: classifyMovies.movies
        })
    } else {
        var movies = await Movie
            .find({})
            .sort('meta.updateAt')
            .exec()
        await ctx.render('pages/list', {
            title: '电影列表',
            movies: movies
        })
    }
}
// views/detail
exports.detail = async(ctx, next)=> {
    var id = ctx.params.id
    console.log('PC movie detail id: ' + id)
    await Movie.update({_id:id}, {$inc: {pv: 1}}) // pv:1 1是增加值，也就是每次加1
    var movie = await Movie.findOne({_id: id}).exec()
    console.log('PC movie detail movie: ')
    console.log(movie)
    var comments = await Comment
        .find({movie: id}) // 返回id电影
        .populate('from reply.from reply.to', 'name') // 利用populate查询from，因为from指向user，所以查的就是user,然后获取其中的name属性
        .exec() // 上面就能成功返回name属性，指定啥返回啥
    // 可以把name改成password就清楚了
    console.log('PC movie detail comments: ')
    console.log(comments)
    await ctx.render('pages/detail', {
        title: movie.title + ' 详情',
        movie: movie,
        comments: comments || []
    })
}
// views/admin
exports.new = async(ctx, next)=> {
    var classifys = await Classify.find({}).exec()
    await ctx.render('pages/admin', {
        title: '录入页',
        movie: {},
        classifys: classifys,
    })
}

// POST的新添加的movie信息
exports.save = async(ctx, next)=> {
    var movieObj = ctx.request.body.movie
    console.log(movieObj)
    var id = movieObj._id || ''
    var classifyName = ctx.request.body.movie.classifyName
    var _movie
    var _movieId
    console.log('进入moviesave-------------------')
    if (!classifyName && !movieObj.classify) {
        await ctx.redirect('/admin/movie/new')
    }
    if (classifyName && classifyName != '') {
        var classify = await Classify.findOne({name: classifyName}).exec()
        if (classify) {
            movieObj.classify = classify._id
        } else {
            var classifyNew = await new Classify({name: classifyName}).save()
            movieObj.classify = classifyNew._id
        }
    }
    var classifyAdd = await Classify.findOne({_id: movieObj.classify}).exec()
    if (!id || id === '') {
        var movieNew = await new Movie(movieObj).save()
        _movieId = movieNew._id
    } else {
        _movieId = id
        var movie = await Movie.findOne({_id: _movieId}).exec()
        var classifyDel = await Classify.findOne({_id: movie.classify}).exec()
        for (var i = 0; i < classifyDel.movies.length; i++) {
            if (classifyDel.movies[i] == id) {
                classifyDel.movies.splice(i, 1)
                break
            }
        }
        await classifyDel.save()
        _movie = _.extend(movie, movieObj)
        await _movie.save()
    }
    classifyAdd.movies.push(_movieId)
    await classifyAdd.save()
    await ctx.redirect('/movie/' + _movieId)
}

//admin update movie
exports.update = async(ctx, next)=> {
    var id = ctx.params.id
    if (id) {
        var movie = await Movie.findOne({_id: id}).exec()
        var classifys = await Classify.find({}).exec()
        ctx.render('pages/admin', {
            title: 'website 后台更新页',
            movie: movie,
            classifys: classifys
        })
    } else {
        console.log("你的电影并没有成功录入进去");
    }
}
// delete movie
exports.del = async(ctx, next)=> {
    var id = ctx.query.id
    console.log(id)
    if (id) {
        try {
            await Movie.remove({_id: id}).exec()
            ctx.body = {success: 1}
        }
        catch (err) {
            ctx.body = {success: 0}
        }
    }
}