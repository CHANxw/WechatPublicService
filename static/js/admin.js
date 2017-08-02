$(function () {
    $('.del').click(function (e) {
        var target = $(e.target)
        var id = target.data('id')
        var tr = $('.item-id-' + id)
        $.ajax({
            type: 'DELETE',
            url:'/admin/movie/list?id=' + id
        })
            .done(function (results) {
                if(results.success === 1) {
                    if (tr.length > 0) {
                        tr.remove()
                    }
                }
            })
    })
    $('#douban').blur(function () {
        var douban = $(this)
        var id = douban.val()
        if (!id && id == '') return
        $.ajax({
            dataType:'jsonp',
            cache: true, // 储存
            url:'https://api.douban.com/v2/movie/subject/' + id,
            crossDomain: true, // 跨域
            jsonp: 'callback',
            success: function (data) {
                inputText(data)
            }
        })
    })
    $('#doubanSearch').blur(function () {
        var douban = $(this)
        var id = douban.val()
        if (!id && id == '') return
        $.ajax({
            dataType:'jsonp',
            cache: true, // 储存
            url:'https://api.douban.com/v2/movie/search?q=' + id,
            crossDomain: true, // 跨域
            jsonp: 'callback',
            success: function (res) {
                var id = res.subjects[0].id
                $.ajax({
                    dataType:'jsonp',
                    cache: true, // 储存
                    url:'https://api.douban.com/v2/movie/subject/' + id,
                    crossDomain: true, // 跨域
                    jsonp: 'callback',
                    success: function (data) {
                        inputText(data)
                    }
                })
            }
        })
    })
})
function inputText(data) {
    $('#inputTitle').val(data.title)
    $('#inputDirector').val(data.directors[0].name)
    $('#inputCountry').val(data.countries)
    $('#inputPoster').val(data.images.large)
    $('#inputYear').val(data.year)
    $('#inputSummary').val(data.summary)
}