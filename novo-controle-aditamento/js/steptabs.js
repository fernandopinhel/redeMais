// script for tab steps
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var href = $(e.target).attr('href');
    var curr = $(".process-model a[href='" + href + "']").parent();
  
    $('.process-model li').removeClass();
    curr.addClass("active");
    curr.prevAll().addClass("visited");
  });
  
  $('.process-model li').click(function(){
    $(".tab-pane").removeClass("animation-to-right");
    $(".tab-pane").addClass("animation-to-left");
  });
  
  $('.process-model li.visited').click(function(){
    $(".tab-pane").addClass("animation-to-right");
    $(".tab-pane").removeClass("animation-to-left");
  });
  
  $('.process-model li.active').click(function(){
    $(".tab-pane").removeClass("animation-to-left");
    $(".tab-pane").addClass("animation-to-right");
  });
  
  $('.process-model li.visited.active').click(function(){
    $(".tab-pane").removeClass("animation-to-right");
    $(".tab-pane").addClass("animation-to-left");
  });
  
  $('button.next').click(function(){
    $('.nav li.active').next('li').find('a').attr("data-toggle","tab").trigger("click");
    $(".tab-pane").addClass("animation-to-left");
    $(".tab-pane").removeClass("animation-to-right");
  });
  
  $('button.prev').click(function() {
    $('.nav li.active').prev('li').find('a').attr("data-toggle","tab").trigger("click");
    $(".tab-pane").addClass("animation-to-right");
    $(".tab-pane").removeClass("animation-to-left");
    $(".btn-final").addClass("d-none");
    $(".btn-next").removeClass("d-none");
  });
  
  $('a[href="#vistoria"]').click(function(){
      $(".btn-final").removeClass("d-none");
    $(".btn-next").addClass("d-none");
  });
  
  $('a[href="#dados-veiculos"]').click(function(){
      $(".btn-final").addClass("d-none");
    $(".btn-next").removeClass("d-none");
  });
  
  $('a[href="#dados-pessoais"]').click(function(){
    $(".btn-final").addClass("d-none");
    $(".btn-next").removeClass("d-none");
  });
  