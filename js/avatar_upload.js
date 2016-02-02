/**
 * Created by anyaran on 16/1/29.
 */

var AVATAR_BIG_WIDTH = 100;
var AVATAR_BIG_HEIGHT = 100;
var AVATAR_SMALL_WIDTH = 55;
var AVATAR_SMALL_HEIGHT = 55;

var AVATAR_RADIO = AVATAR_BIG_WIDTH/AVATAR_BIG_HEIGHT;
var jcrop_api = null;


$(function(){
    mouseOverOut('fileImg','openImgBtn','avatar-filebtn-hover');
    mouseOverOut('saveAvatar','saveAvatar','avatar-savebtn-hover');
    mouseOverOut('fileReImg','avatarRechoicebtn','avatar-cancelbtn-hover');

    $(document).on('change','#fileImg,#fileReImg',function(){
        ajaxFileUpload(); // 上传插件调用
    });

    $('#saveAvatar').on('click',function(){
        saveCropAvatar();
    });

});

// 鼠标移过按钮效果
function mouseOverOut(hover_id,target_id,class_name){
    $(document).on('mouseover','#'+hover_id,function(){
        $('#'+target_id).addClass(class_name);
    }).on('mouseout','#'+hover_id,function () {
        $('#'+target_id).removeClass(class_name);
    });
}

// 上传成功失败提示
function uploadStatus(state,msg){
    // state => 0:成功 1:失败
    if (state == 0) {
        $('#avatarPrompt').html(msg).removeClass('avatar-hide');
    } else {
        $('#avatarPrompt').html(msg).removeClass('avatar-hide').addClass('avatar-statuserror');
    }
}

// 上传裁剪头像
function ajaxFileUpload(){
    // 开始上传文件时显示一个图片
    $(document).ajaxStart(function() {
        $("#loadingSpan").removeClass('avatar-hide');
        // 文件上传完成将图片隐藏起来
    }).ajaxStop(function() {
        $("#loadingSpan").addClass('avatar-hide');
    });
    $.ajaxFileUpload({
        url: "./ajax/fileupload.json",
        type: 'POST',
        fileElementId: 'fileImg',
        secureuri: false, //是否需要安全协议，一般设置为false
        dataType: 'JSON', //返回值类型 一般设置为json
        data: {},
        success: function(data,status) {
            if(data.success) {
                if(jcrop_api!=null) jcrop_api.destroy();

                $("#crop_tmp_avatar").val(data.tmp_avatar);
                $("#avatarCrop").removeClass('avatar-hide');
                $("#previewBoxBig, #previewBoxSmall").html('<img src="tmp/'+data.tmp_avatar+'">');

                $('#cropImg').attr('src','tmp/'+data.tmp_avatar);

                $('#cropImg').Jcrop({
                    allowSelect: false,
                    onChange: updatePreview,
                    onSelect: updatePreview,
                    aspectRatio: AVATAR_RADIO,
                    bgColor: 'transparent'
                },function(){
                    jcrop_api = this;

                    var bounds = jcrop_api.getBounds();
                    var x1,y1,x2,y2;
                    if(bounds[0]/bounds[1] > AVATAR_RADIO) {
                        y1 = 0;
                        y2 = bounds[1];

                        x1 = (bounds[0] - AVATAR_BIG_WIDTH * bounds[1]/AVATAR_BIG_HEIGHT)/2;
                        x2 = bounds[0]-x1;
                    } else {
                        x1 = 0;
                        x2 = bounds[0];

                        y1 = (bounds[1] - AVATAR_BIG_HEIGHT * bounds[0]/AVATAR_BIG_WIDTH)/2;
                        y2 = bounds[1]-y1;
                    }
                    jcrop_api.setSelect([x1,y1,x2,y2]);

                    $('#saveAvatar').removeClass('avatar-disabled').attr('disabled',false);
                    $('#avatarRechoicebtn,#fileReImg').removeClass('avatar-hide');
                });
            } else {
                alert(data.description);
            }
        },
        error: function (data,status,e)//服务器响应失败处理函数
        {
            alert('error');
        }
    });
}

// 更新头像预览
function updatePreview(c) {
    var $previewImgBig = $('#previewBoxBig img'),
        $previewImgSmall = $('#previewBoxSmall img');

    $('#crop_x1').val(c.x);
    $('#crop_y1').val(c.y);
    $('#crop_x2').val(c.x2);
    $('#crop_y2').val(c.y2);
    $('#crop_w').val(c.w);
    $('#crop_h').val(c.h);

    if (parseInt(c.w) > 0)
    {
        var rx_big = AVATAR_BIG_WIDTH / c.w;
        var ry_big = AVATAR_BIG_HEIGHT / c.h;

        var rx_small = AVATAR_SMALL_WIDTH / c.w;
        var ry_small = AVATAR_SMALL_HEIGHT / c.h;

        var bounds = jcrop_api.getBounds();
        var boundx = bounds[0];
        var boundy = bounds[1];

        $previewImgBig.css({
            width: Math.round(rx_big * boundx) + 'px',
            height: Math.round(ry_big * boundy) + 'px',
            marginLeft: '-' + Math.round(rx_big * c.x) + 'px',
            marginTop: '-' + Math.round(ry_big * c.y) + 'px'
        });

        $previewImgSmall.css({
            width: Math.round(rx_small * boundx) + 'px',
            height: Math.round(ry_small * boundy) + 'px',
            marginLeft: '-' + Math.round(rx_small * c.x) + 'px',
            marginTop: '-' + Math.round(ry_small * c.y) + 'px'
        });
    }
}

// 保存头像
function saveCropAvatar() {
    if($("#crop_tmp_avatar").val()=="") {
        uploadStatus(1,'您还没有上传头像');
        return false;
    }

    $.ajax({
        type: "POST",
        url: "./ajax/saveavatar.json",
        data: $("#form_crop_avatar").serialize(),
        dataType: "json",
        success: function(json) {
            if(json.success) {
                $("#crop_tmp_avatar").val("");
                uploadStatus(0,'成功更新头像');
                $("#avatarCrop").addClass('avatar-hide');
                $('#saveAvatar').addClass('avatar-disabled');
                $('#saveAvatar').attr('disabled',true);
                $('#avatarRechoicebtn').addClass('avatar-hide');
                $('#fileReImg').addClass('avatar-hide');
                setTimeout(function(){
                    $('#avatarPrompt').addClass('avatar-hide');
                },1000);
            } else {
                uploadStatus(1,json.description);
            }
        }
    });
}