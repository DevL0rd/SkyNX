var logTimeout
var Encodingfps = "0";
var fps = "0";
var bitrate = "";
ipcRenderer.on('log', function (event, genHtml) {
    $("#consoleContainer").append(genHtml);
    if (genHtml.includes("fps=")) {
        if (genHtml.includes("fps= ")) {
            Encodingfps = genHtml.split("fps= ")[1].split(" ")[0];
        } else {
            Encodingfps = genHtml.split("fps=")[1].split(" ")[0];
        }
        if (genHtml.includes("bitrate=")) {
            bitrate = genHtml.split("bitrate=")[1].split(" ")[0];
        }
        $("#statusbartext").html("FPS: " + fps + "     Encoding FPS: " + Encodingfps + "     Bitrate: " + bitrate);
        encodingFpsChartData.datasets[0].data.push(parseInt(Encodingfps));
        if (encodingFpsChartData.datasets[0].data.length > 40) {
            encodingFpsChartData.datasets[0].data.shift();
        }
        if ($("#stats").is(":visible")) {
            encodingFpsChartData.labels = genrateLabelList("FPS", encodingFpsChartData.datasets[0].data.length);
            encodingFpsChart.update(0);
        }
    } else if (genHtml.includes("switchFps=")) {
        fps = genHtml.split("switchFps=")[1].split(" ")[0].replace("<br>", "");
        $("#statusbartext").html("FPS: " + fps + "     Encoding FPS: " + Encodingfps + "     Bitrate: " + bitrate);
        fpsChartData.datasets[0].data.push(parseInt(fps));
        if (fpsChartData.datasets[0].data.length > 40) {
            fpsChartData.datasets[0].data.shift();
        }
        if ($("#stats").is(":visible")) {
            fpsChartData.labels = genrateLabelList("FPS", fpsChartData.datasets[0].data.length);
            fpsChart.update(0);
        }
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
