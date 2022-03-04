
ipcRenderer.on('close', function (event, data) {
    $("#startBtn").addClass('btn-dark').removeClass('btn-danger');
    $("#startBtn").html("Start Streamer");
    running = false;
});
var running = false;
function connect() {
    ipcRenderer.send('connect', { ip: clientSettings.ip, q: clientSettings.quality, disableVideo: clientSettings.disableVideo, disableAudio: clientSettings.disableAudio, abxySwap: clientSettings.abxySwap, encoding: clientSettings.encoding, limitFPS: clientSettings.limitFPS, mouseControl: clientSettings.mouseControl });
}
function disconnect() {
    ipcRenderer.send('kill');
}
function restart() {
    ipcRenderer.send('restart', { ip: clientSettings.ip, q: clientSettings.quality, disableVideo: clientSettings.disableVideo, disableAudio: clientSettings.disableAudio, abxySwap: clientSettings.abxySwap, encoding: clientSettings.encoding, limitFPS: clientSettings.limitFPS, mouseControl: clientSettings.mouseControl });
}
$('#startBtn').click(function () {
    if (!running) {
        connect();
    } else {
        disconnect();
    }
    $('#startBtn').addClass('btn-danger').removeClass('btn-dark');
    $("#startBtn").html("End Streamer");
    running = true;
});
$('#donateBtn').click(function () {
    ipcRenderer.send('donate');
});
$("#main-btn").click(function () {
    $(".contentArea").hide();
    $("#main").fadeIn(400);
    $('#main-btn').tooltip('hide');
});