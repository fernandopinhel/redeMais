// calculo de economia
$(".vlr-alterado").addClass("d-none");
$(".btn-alterar-vlr").click(function(){
  $(".vlr-alterado").removeClass("d-none");
  $(".vlr-alterar").addClass("d-none");
});
// fim calculo de economia

// script icone animacao info prestadores
function toggleFunction(x) {
  x.classList.toggle("change");
}
// fim script icone animacao info prestadores
// input file
$(document).ready(function(){
	$('#filer_input').filer({
		showThumbs: true,
		addMore: true,
		allowDuplicates: false
	});
});
// fim input file

// scripts msg alertas
$(".close-error").click(function(){
  $('#msg-input-error').addClass('d-none')
});
// fim scripts msg alertas

// tabela com header fixo
var $th = $('.tableFixHead').find('thead th')
$('.tableFixHead').on('scroll', function() {
  $th.css('transform', 'translateY('+ this.scrollTop +'px)');  
});
// fim tabela com header fixo

// carregando divs
$('#identificacao-do-prestador').on('click', function () {
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.identificacao-do-prestador').removeClass('hidden');
  $('#identificacao-do-prestador > .card-painel').addClass('active');
});

$('#identificacao-do-procedimento').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.identificacao-do-procedimento').removeClass('hidden');
  $('#identificacao-do-procedimento  > .card-painel').addClass('active');
});

$('#marcacao-lista-prioritaria-pmo').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.marcacao-lista-prioritaria-pmo').removeClass('hidden');
  $('#marcacao-lista-prioritaria-pmo  > .card-painel').addClass('active');
});

$('#sinistro-cm-alcadas').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.sinistro-cm-alcadas').removeClass('hidden');
  $('#sinistro-cm-alcadas  > .card-painel').addClass('active');
});

$('#pmo-negociacoes').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.pmo-negociacoes').removeClass('hidden');
  $('#pmo-negociacoes  > .card-painel').addClass('active');
});

$('#pmo-aditivos').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.pmo-aditivos').removeClass('hidden');
  $('#pmo-aditivos  > .card-painel').addClass('active');
});

$('#premissas-etapas-de-calculo-economia').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.premissas-etapas-de-calculo-economia').removeClass('hidden');
  $('#premissas-etapas-de-calculo-economia  > .card-painel').addClass('active');
});

$('#economias-potencial-negociada-implantada').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.economias-potencial-negociada-implantada').removeClass('hidden');
  $('#economias-potencial-negociada-implantada  > .card-painel').addClass('active');
});

// Premissas
$('.bread-alterar-premissas-aderencia-efetividade').addClass('hidden');
$('.hidden-inputs').addClass('hidden');
$('.alterar-premissas-2').addClass('hidden');
$('.title-premissas-alterar').addClass('hidden');
$('.btns-premissas').addClass('hidden');

$('.alterar-premissas-1').on('click', function () {    
  $('.bread-alterar-premissas-aderencia-efetividade').removeClass('hidden');
  $('.hidden-inputs').removeClass('hidden');
  $('.btns-premissas').removeClass('hidden');
  $('.title-premissas-alterar').removeClass('hidden');
  $('.title-premissas-consulta').addClass('hidden');
  $('.alterar-premissas-1').addClass('hidden');
  $('.show-inputs').addClass('hidden');
});

$('.btn-alteracao-premissas').on('click', function () {    
  $('.bread-alterar-premissas-aderencia-efetividade').addClass('hidden');
  $('.hidden-inputs').addClass('hidden');
  $('.btns-premissas').addClass('hidden');
  $('.title-premissas-alterar').addClass('hidden');
  $('.title-premissas-consulta').removeClass('hidden');
  $('.alterar-premissas-1').removeClass('hidden');
  $('.show-inputs').removeClass('hidden');
});

$('#premissas-inflacao').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.premissas-inflacao').removeClass('hidden');
  $('#premissas-inflacao  > .card-painel').addClass('active');
  $('.bread-alterar-premissas-aderencia-efetividade').addClass('hidden');
});

$('#premissas-aderencia').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( "#group-cards > div.btns-group").each(function() {$(this).removeClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.premissas-aderencia').removeClass('hidden');
  $('#premissas-aderencia  > .card-painel').addClass('active');
});
// fim carregando divs


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

 // carrossel
 $('#carousel-cards').on('slide.bs.carousel', function (e) {
  var $e = $(e.relatedTarget);
  var idx = $e.index();
  var itemsPerSlide = 4;
  var totalItems = $('.carousel-item').length;

  if (idx >= totalItems-(itemsPerSlide-1)) {
      var it = itemsPerSlide - (totalItems - idx);
      for (var i=0; i<it; i++) {
          // append slides to end
          if (e.direction=="left") {
              $('.carousel-item').eq(i).appendTo('.carousel-inner');
          }
          else {
              $('.carousel-item').eq(0).appendTo('.carousel-inner');
          }
      }
  }
});
$('.carousel').carousel({interval: 0})
// fim carrossel

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

