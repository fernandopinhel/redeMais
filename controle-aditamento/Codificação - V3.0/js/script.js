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

$('#datepickerMesAno').datetimepicker({
language:  'pt-BR',
format: "mm/yyyy",
startView: 3,
minView: 3,  
startDate:'01/2010',
forceParse: 0
// weekStart: 1,
// todayHighlight: 1,
// todayBtn: 1
});
// fim datepicker mes e ano

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

function toggleFunction(x) {
  x.classList.toggle("change");
}

$(document).ready(function() {
    $('#multiple-selected').multiselect();
});

$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
});

function changeMenu(x) {
    x.classList.toggle("change-2");
  }

  (function($) {
    'use strict';

    $(document).on('show.bs.tab', '.nav-tabs-responsive [data-toggle="tab"]', function(e) {
      var $target = $(e.target);
      var $tabs = $target.closest('.nav-tabs-responsive');
      var $current = $target.closest('li');
      var $parent = $current.closest('li.dropdown');
      $current = $parent.length > 0 ? $parent : $current;
      var $next = $current.next();
      var $prev = $current.prev();
      var updateDropdownMenu = function($el, position){
        $el
          .find('.dropdown-menu')
          .removeClass('pull-xs-left pull-xs-center pull-xs-right')
          .addClass( 'pull-xs-' + position );
      };

      $tabs.find('>li').removeClass('next prev');
      $prev.addClass('prev');
      $next.addClass('next');

      updateDropdownMenu( $prev, 'left' );
      updateDropdownMenu( $current, 'center' );
      updateDropdownMenu( $next, 'right' );
    });

    })(jQuery);

    $('.form_date').datetimepicker({
      language:  'pt-BR',
      autoclose: 1,
      minView: 2,
      format: "dd/mm/yyyy"
      });

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

         // Máscara formato data no campo date 99/99/9999
      function mascaraData(campo, e){
        var kC = (document.all) ? event.keyCode : e.keyCode;
        var data = campo.value;
        if( kC!=8 && kC!=46 ){
          if( data.length==2 ){
            campo.value = data += '/';
          }else if( data.length==5){
          campo.value = data += '/';
        }else
      campo.value = data;
      }
    }



// carregando divs
// quimioterapia
$('#planilha-acompanhamento').on('click', function () {
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.planilha-acompanhamento').removeClass('hidden');
  $('#planilha-acompanhamento > .card-painel').addClass('active');
});

$('#nao-listados').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});  
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.nao-listados').removeClass('hidden');
  $('#nao-listados  > .card-painel').addClass('active');
});
// fim quimioterapia
// ambulatorio
$('#pps-ambulatoriais').on('click', function () {
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.pps-ambulatoriais').removeClass('hidden');
  $('#pps-ambulatoriais > .card-painel').addClass('active');
});

$('#neg-nao-listados').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});  
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.neg-nao-listados').removeClass('hidden');
  $('#neg-nao-listados  > .card-painel').addClass('active');
});
// fim ambulatorio
// materiais e medicamentos
$('#premissas').on('click', function () {
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.premissas').removeClass('hidden');
  $('#premissas > .card-painel').addClass('active');
});

$('#tab-praticada').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});  
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.tab-praticada').removeClass('hidden');
  $('#tab-praticada  > .card-painel').addClass('active');
});

$('#congelamento-desagravo').on('click', function () {    
  $( "#group-cards > div").each(function() {$(this).addClass("hidden");});  
  $( ".card-painel").each(function() {$(this).removeClass("active");});
  $('.congelamento-desagravo').removeClass('hidden');
  $('#congelamento-desagravo  > .card-painel').addClass('active');
});
// fim materiais e medicamentos
// fim carregando divs