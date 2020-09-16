// script Toggle menu
$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
        $("#sidebar").css("transition", "all 0.6s cubic-bezier(0.945, 0.020, 0.270, 0.665)");
    });
});
// fim script Toggle menu

// script Tooltip
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
})
// fim script Tooltip

// Script Popover
$(document).ready(function(){
    $('[data-toggle="popover"]').popover();
});

$(document).ready(function () {
    $("[data-toggle=popover]")
    .popover({html:true})
})
// fim script Popover

// script datepicker
$('.form_date').datetimepicker({
    language:  'pt-BR',
    autoclose: 1,
    minView: 2,
    format: "dd/mm/yyyy"
});
// fim script datepicker

// marcar todos checkbox
function marcarTodos(marcardesmarcar){
    $('.marcar').each(function () {
        this.checked = marcardesmarcar;
    });
}
// fim marcar todos checkbox

// marcar todos checkbox exclusão
$(".excluir-todos-check").click(function(){
    $('.excluir-todos').toggleClass('d-none')    
});
// fim marcar todos checkbox exclusão

// efeitos nos inputs
 $(window, document, undefined).ready(function() {
    $('input').blur(function() {
      var $this = $(this);
      if ($this.val())
        $this.addClass('used');
      else
        $this.removeClass('used');
    });

    $('input[type=radio').blur(function() {
        var $this = $(this);
        if ($this.val())
          $this.removeClass('used');
        else
          $this.removeClass('used');
      });

      $('input[type=checkbox').blur(function() {
        var $this = $(this);
        if ($this.val())
          $this.removeClass('used');
        else
          $this.removeClass('used');
      });
  
    var $ripples = $('.ripples');
  
    $ripples.on('click.Ripples', function(e) {
  
      var $this = $(this);
      var $offset = $this.parent().offset();
      var $circle = $this.find('.ripplesCircle');
  
      var x = e.pageX - $offset.left;
      var y = e.pageY - $offset.top;
  
      $circle.css({
        top: y + 'px',
        left: x + 'px'
      });
  
      $this.addClass('is-active');
  
    });
  
    $ripples.on('animationend webkitAnimationEnd mozAnimationEnd oanimationend MSAnimationEnd', function(e) {
        $(this).removeClass('is-active');
    });
  });


$('input[type=checkbox').removeClass('used')
  
var inputDate = $('.input-date')
if($(".input-date").val(length.css("display", "none"))){
        $(".datetimepicker").click(function(inputDate){
        $(this).addClass("used");
    });   
}
// fim efeitos nos inputs