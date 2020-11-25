// Prazos
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

  var data = google.visualization.arrayToDataTable([
    ['Tipo', 'Valor'],
    ['Dentro do Prazo', 900],
    ['Fora do Prazo', 38],
  ]);

  var options = {
    fontSize: 15,
    backgroundColor: 'transparent',       
    pieHole: 0.5,
    pieSliceText: 'value',
    pieSliceTextStyle: {
      color: 'white',
    },
    legend: 'block',
    legend: 'bottom',    
    colors: ['#00683c', '#f0172c']
  };
  
  var chart = new google.visualization.PieChart(document.getElementById('prazos'));
  chart.draw(data, options);
}
// Fim Prazos

// Tipo Aditivos
google.charts.load("current", {packages:['corechart']});
google.charts.setOnLoadCallback(drawChart2);
function drawChart2() {
  var data = google.visualization.arrayToDataTable([
    ["Tipo Aditivo", "Tipos", { role: "style" } ],    
    ["Rede +", 65, "#c86366"],
    ["Prioridade", 35, "#149dc1"],
    ["Normal", 25, "#608918"]
  ]);

  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
    { calc: "stringify",
        sourceColumn: 1,        
        type: "string",
        role: "annotation" },
    2]);

  var options = {
    fontSize: 15,
    backgroundColor: 'transparent',    
    bar: {groupWidth: "25%"},          
    legend: { position: "none" },    
  };
  var chart = new google.visualization.ColumnChart(document.getElementById("tipo-aditivo"));
  chart.draw(view, options);
}
// Fim Tipo Aditivos

$(window).resize(function(){
    drawChart();
    drawChart2();
});