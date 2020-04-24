
ipcRenderer.on('close', function (event, data) {
    $("#startBtn").addClass('btn-dark').removeClass('btn-danger');
    $("#startBtn").html("Start Streamer");
    running = false;
});
ipcRenderer.on('started', function (event, data) {
    $('#startBtn').addClass('btn-danger').removeClass('btn-dark');
    $("#startBtn").html("End Streamer");
    running = true;
})
var running = false;
function connect() {
    ipcRenderer.send('connect', { ip: clientSettings.ip, q: clientSettings.quality });
}
function disconnect() {
    ipcRenderer.send('kill');
}
function restart() {
    ipcRenderer.send('restart', { ip: clientSettings.ip, q: clientSettings.quality });
}
$('#startBtn').click(function () {
    if (!running) {
        connect();
    } else {
        disconnect();
    }
});
var qualityChangeTimeout;
$(document).on('input', '#qualitySlider', function () {
    $('#qualityLabel').html("Quality: " + $(this).val() + "Mbps");
    clientSettings.quality = $(this).val();
    saveClientSettings();
    if (running) {
        clearTimeout(qualityChangeTimeout);
        qualityChangeTimeout = setTimeout(restart, 1000)
    }
});

$(document).on('input', '#ipInput', function () {
    clientSettings.ip = $(this).val();
    saveClientSettings();
});

$("#main-btn").click(function () {
    $(".contentArea").hide();
    $("#main").fadeIn(400);
    $('#main-btn').tooltip('hide');
});
