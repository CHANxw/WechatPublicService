// 负责与首页进行交互
var Movie = require('../models/movie')
var movieApi = require('../api/movie')
// views/index
exports.index = async(ctx, next)=> {
    console.log('首页-------')
    var classifys = await movieApi.findAll()
    await ctx.render('pages/index', {
        title: '首页',
        classifys: classifys
    })
}
exports.search = async(ctx, next) => {
    var search = ctx.query.search
    var limit = 2
    if (search) {
        var classify = await movieApi.searchByClassify({name: search})
        if (!classify) {
            var movie = await movieApi.searchByName(search)
            if (!movie) {
                ctx.redirect('/')
            } else {
                ctx.redirect('/movie/' + movie._id)
            }
        } else {
            Movie.findPaginated({classify: classify._id}, function (err, result) {
                if (err) console.log(err)
                console.log(result)
                ctx.render('pages/results', {
                    title: '分类查询页',
                    movies: result.documents,
                    classifyId: classify._id,
                    name: classify.name,
                    currentPage: 1,
                    totalPages: result.totalPages,
                    prevPage: result.prevPage,
                    nextPage: result.nextPage
                })
            }, limit, 1)
        }

    } else {
        var classifyId = ctx.query.classify
        var name = ctx.query.name
        var page = ctx.query.p
        Movie.findPaginated({classify: classifyId}, function (err, result) {
            if (err) console.log(err)
            console.log(result)
            ctx.render('pages/results', {
                title: '分类查询页',
                movies: result.documents,
                classifyId: classifyId,
                name: name,
                currentPage: page,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage
            })
        }, limit, page)
    }
}