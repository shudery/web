$(document).ready(function(){
    $(".list-2 a").click(function(){
        $(".word-1").hide();
        $(".word-2").show();
        $(".word-3").hide();
        $(".word-4").hide();
        $(".word-5").hide();
        $(".list-2").addClass("hideb");
        $(".list-1").removeClass("hideb");
    })
    $(".list-3 a").click(function(){
        $(".word-1").hide();
        $(".word-3").show();
        $(".word-2").hide();
        $(".word-4").hide();
        $(".word-5").hide();
    })
    $(".list-4 a").click(function(){
        $(".word-1").hide();
        $(".word-4").show();
        $(".word-3").hide();
        $(".word-2").hide();
        $(".word-5").hide();
    })
    $(".list-5 a").click(function(){
        $(".word-1").hide();
        $(".word-5").show();
        $(".word-3").hide();
        $(".word-4").hide();
        $(".word-2").hide();
    })
    $(".list-1 a").click(function(){
        $(".word-2").hide();
        $(".word-1").show();
        $(".word-3").hide();
        $(".word-4").hide();
        $(".word-5").hide();
    })
})