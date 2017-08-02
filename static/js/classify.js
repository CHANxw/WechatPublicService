$(function () {
    $('.btn-classify').click(function (e) {
        var param = $('#formClassify').serialize()
        console.log(param)
        $.ajax({
            cache: false,
            type: 'POST',
            url: '/admin/classify',
            data: param
        })
            .done(function (results) {
                if (results.text) {
                    $('.alertText').html(results.text)
                } else {
                    window.location.reload()
                }
            })
    })
})