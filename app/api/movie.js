// 负责与首页进行交互
var Movie = require('../models/movie')
var Classify = require('../models/classify')
var Comment = require('../models/comment')
var User = require('../models/user')
var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var _ = require('lodash')
// views/index
exports.findAll = async()=> {
    var classifys = await Classify
        .find({})
        .populate({path: 'movies', options: {limit: 5}})
        .exec()
    return classifys
}
exports.findHot = async(count)=> {
    var movies = await Movie
        .find({})
        .sort({pv: -1})
        .limit(count)
        .exec()
    return movies
}
exports.findHaveComment = async(name)=> {
    var user = await User.findOne({openId: name}).exec()
    if (user) {
        var comment = await Comment
            .findOne({from: user._id})
            .sort({'meta.createAt': -1})
            .populate({path: 'movies'})
            .exec()
        if (comment) {
            var movie = await Movie.findOne({_id: comment.movie}).exec()
            return movie
        }
    }
    return '还没有进行评论'
}
exports.searchByName = async(search) => {
    // Movie.find({title: new RegExp(search + '.*', 'i')},function (err, movies) {
    //     return movies
    // })
    var movies = await Movie
        .find({title: new RegExp(search + '.*', 'i')})
        .exec()
    return movies
}
exports.searchByClassify = async(value) => {
    console.log(value)
    var classify = await Classify
        .findOne(value)
        .populate({})
        .exec(function (err, classify) {
            if (err) console.log(err)
            console.log(classify)
        })
    return classify
}
exports.searchById = async(id)=> {
    var movie = await Movie
        .findOne({_id: id})
        .exec()
    return movie
}
var updateMovies = async(movie) => {
    var options = {
        url: 'https://api.douban.com/v2/movie/subject/' + movie.douBanId,
        json: true,
    }
    var classifyAdd
    await request(options).then(res => {
        var data = res.body
        _.extend(movie, {
            country: data.countries[0],
            language: data.language,
            summary: data.summary,
        })
    })
    await movie.save()
    if (movie.genres && movie.genres.length > 0) {
        var genre = movie.genres[0]
        if (genre != '') {
            classifyAdd = await Classify.findOne({name: genre}).exec()
            if (classifyAdd && classifyAdd != '') {
                classifyAdd.movies.push(movie._id)
                classifyAdd = await classifyAdd.save()
            } else {
                classifyAdd = await new Classify({name: genre, movies: [movie._id]}).save()
            }
            movie.classify = classifyAdd._id
            console.log('classifyAdd._id:  ' + classifyAdd._id)
            await movie.save()
        }
    }
}
// 同步完成_movie搜索与储存
var _movie = async(subjects)=> {
    var movies = []
    for (var i = 0; i < subjects.length; i++) {
        var movie = await Movie.findOne({douBanId: subjects[i].id}).exec()
        if (movie) {
            movies.push(movie)
        } else {
            var directors = subjects[i].directors || []
            var director = directors[0] || {}
            movie = new Movie({
                director: director.name || '',
                title: subjects[i].title,
                douBanId: subjects[i].id,
                poster: subjects[i].images.large,
                year: subjects[i].year,
                genres: subjects[i].genres || []
            })
            console.log(movie)
            console.log('---------添加新的')
            movie = await movie.save()
            movies.push(movie)
        }
    }
    movies.forEach(async (movie)=> {
        await updateMovies(movie)
    })
    return movies
}
exports.searchByDouBan = async(search) => {
    var options = {
        url: 'https://api.douban.com/v2/movie/search?q=',
        json: true,
    }
    var subjects = []
    var movies = []
    options.url += encodeURIComponent(search)
    var data = await request(options)
        .then(res => {
            return res.body
        })
    if (data && data.subjects) {
        subjects = data.subjects
    }
    if (subjects.length > 0) {
        movies = await _movie(subjects)
    }
    return movies
}