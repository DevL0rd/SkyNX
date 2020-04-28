function genrateLabelList(label, length) {
    var labels = [];
    while (length > 0) {
        labels.push(label);
        length--;
    }
    return labels;
}
var encodingFpsChartData = {
    labels: ['FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS'],
    datasets: [{
        label: 'FPS',
        data: [0],
        backgroundColor: 'rgba(0, 0, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0)',
        fillOpacity: .3,
        fill: true,
        borderWidth: 0
    }]
};

var encodingFpsChartctx = document.getElementById('encodingFpsChart').getContext('2d');
var encodingFpsChart = new Chart(encodingFpsChartctx, {
    type: 'line',
    data: encodingFpsChartData,
    options: {
        maintainAspectRatio: false,
        legend: {
            display: false
        },
        elements: {
            point: {
                radius: 0
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    max: 60
                }
            }],
            xAxes: [{
                gridLines: {
                    display: false
                },
                ticks: {
                    display: false //this will remove only the label
                }
            }]
        }
    }
});

var fpsChartData = {
    labels: ['FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS', 'FPS'],
    datasets: [{
        label: 'FPS',
        data: [0],
        backgroundColor: 'rgba(0, 0, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0)',
        fillOpacity: .3,
        fill: true,
        borderWidth: 0
    }]
};

var fpsChartctx = document.getElementById('fpsChart').getContext('2d');
var fpsChart = new Chart(fpsChartctx, {
    type: 'line',
    data: fpsChartData,
    options: {
        maintainAspectRatio: false,
        legend: {
            display: false
        },
        elements: {
            point: {
                radius: 0
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    max: 60
                }
            }],
            xAxes: [{
                gridLines: {
                    display: false
                },
                ticks: {
                    display: false //this will remove only the label
                }
            }]
        }
    }
});
$("#stats-btn").click(function () {
    $(".contentArea").hide();
    $("#stats").fadeIn(400);
    $('#stats-btn').tooltip('hide');
});
