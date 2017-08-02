$(function () {
    $('.comment').click(function (e) {
        var target = $(this)
        var toId = target.data('tid')
        var commentId = target.data('cid')
        if ($('#toId').length > 0) {
            $('#toId').val(toId)
        } else {
            $('<input>').attr({
                id: 'toId',
                type: 'hidden',
                name: 'comment[tid]',
                value: toId
            }).appendTo('#commentForm')
        }
        if ($('#commentId').length > 0) {
            $('#commentId').val(commentId)
        } else {
            $('<input>').attr({
                id: 'commentId',
                type: 'hidden',
                name: 'comment[cid]',
                value: commentId
            }).appendTo('#commentForm')
        }
    })
    $('.btn-comment').click(function (e) {
        e.preventDefault()
        $.ajax({
            type: 'POST',
            data: $('#commentForm').serialize(),
            url: '/user/comment'
        }).done(function (results) {
            if(results.success == 1) {
                window.location.reload()
            }
        })
    })

})