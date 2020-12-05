// datepicker mes e ano
$('#datepickerMes').datetimepicker({
    language:  'pt-BR',
    format: "mm",
    startView: 3,
    minView: 3,
    forceParse: 0
});

$('#datepickerAno').datetimepicker({
    language:  'pt-BR',
    format: "yyyy",
    startView: 4,
    minView: 4,
    forceParse: 0
});
// fim datepicker mes e ano

//tabpanes nova ficha
$(".tabs-fichas-matmed").click(function(){
  $('#navtabs-aditivo').addClass('hidden')
  $('#navtabs-matmed').removeClass('hidden')
  $('.tabs-fichas-aditivos > a').removeClass('active')
  $('.tabs-fichas-matmed > a').addClass('active')
});

$(".tabs-fichas-aditivos").click(function(){
  $('#navtabs-aditivo').removeClass('hidden')
  $('#navtabs-matmed').addClass('hidden')
  $('.tabs-fichas-aditivos > a').addClass('active')
  $('.tabs-fichas-matmed > a').removeClass('active')
});
//fim tabpanes nova ficha

// script icone animacao info prestadores
function toggleFunction(x) {
  x.classList.toggle("change");
}
// fim script icone animacao info prestadores

// script btn topo 
window.onscroll = function() {scrollFunction()};

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function scrollToY(scrollTargetY, speed, easing) {
    // scrollTargetY: the target scrollY property of the window
    // speed: time in pixels per second
    // easing: easing equation to use

    var scrollY = window.scrollY || document.documentElement.scrollTop,
        scrollTargetY = scrollTargetY || 0,
        speed = speed || 1000,
        easing = easing || 'easeOutSine',
        currentTime = 0;

    // min time .1, max time .8 seconds
    var time = Math.max(.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, .8));

    // easing equations from https://github.com/danro/easing-js/blob/master/easing.js
    var easingEquations = {
            easeOutSine: function (pos) {
                return Math.sin(pos * (Math.PI / 2));
            },
            easeInOutSine: function (pos) {
                return (-0.5 * (Math.cos(Math.PI * pos) - 1));
            },
            easeInOutQuint: function (pos) {
                if ((pos /= 0.5) < 1) {
                    return 0.5 * Math.pow(pos, 5);
                }
                return 0.5 * (Math.pow((pos - 2), 5) + 2);
            }
        };

    // add animation loop
    function tick() {
        currentTime += 1 / 60;

        var p = currentTime / time;
        var t = easingEquations[easing](p);

        if (p < 1) {
            requestAnimFrame(tick);

            window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));
        } else {
            window.scrollTo(0, scrollTargetY);
        }
    }

    // call it once to get started
    tick();
}

function scrollFunction() {
    if (document.body.scrollTop > 900 || document.documentElement.scrollTop > 250) {
        document.getElementById("myBtn").style.display = "block";
    } else {
        document.getElementById("myBtn").style.display = "none";
    }
}

// fim script btn topo 

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

// inputs animado
$(window, document, undefined).ready(function() {
  $('.input-date').change(function() {
      $(this).focus();
  })
  
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
// fim Inputs animado
