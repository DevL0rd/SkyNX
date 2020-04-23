var logTimeout
ipcRenderer.on('log', function (event, genHtml) {
    $("#consoleContainer").append(genHtml);
    // $("#statusbartext").html("Console: " + genHtml);
    if (genHtml.includes("fps=")) {
        var fps = genHtml.split("fps= ")[1].split(" ")[0];
        var bitrate = genHtml.split("bitrate=")[1].split(" ")[0];
        $("#statusbartext").html("Framrate: " + fps + " Bitrate: " + bitrate);
    } else if (genHtml.includes("Connection timed out") || genHtml.includes("Waiting for connection")) {
        $("#statusbartext").html("Waiting for connection...");
    } else if (genHtml.includes("streamerProcess process exited")) {
        $("#statusbartext").html("Streamer stopped.");
    }
    clearTimeout(logTimeout);
    logTimeout = setTimeout(function () {
        $("#consoleContainer").animate({ scrollTop: $('#consoleContainer').prop("scrollHeight") }, 300);
    }, 300);
});
ipcRenderer.send('registerForHTMLLogging');

function consoleCommand(command) {
    ipcRenderer.send('consoleCommand', command);
}


$("#console-btn").click(function () {
    $(".contentArea").hide();
    $("#console").fadeIn(400);
    $('#console-btn').tooltip('hide');
});
