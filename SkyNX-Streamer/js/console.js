var logTimeout
ipcRenderer.on('log', function (event, genHtml) {
    $("#consoleContainer").append(genHtml);
    $("#statusbartext").html("Console: " + genHtml);
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
