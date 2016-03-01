$(document).ready(function(){
   $(".list-1").bind("click",function(){
       $(".list-1").css("backgroundPosition","0px -20px");
       $(".list-2").css("backgroundPosition","-25px -20px");
        $(".list-block").children().removeClass("container").addClass("container-2");
    });
    $(".list-2").bind("click",function(){

        $(".list-1").css("backgroundPosition","0px 0px");
        $(".list-2").css("backgroundPosition","-25px 0px");
        $(".list-block").children().removeClass("container-2").addClass("container");

    })
});