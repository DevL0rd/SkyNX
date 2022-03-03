
var debug = true;
var clientSettings = {};
var clientSettingsPath = "./settings.json";

if (fs.existsSync(clientSettingsPath)) {
    loadClientSettings();
} else {
    initSettings();
}
function saveClientSettings() {
    DB.save(clientSettingsPath, clientSettings);
}
function initSettings() {
    if (!clientSettings.hasOwnProperty("debug")) {
        clientSettings.debug = false;
    }
    if (!clientSettings.hasOwnProperty("accentColor")) {
        clientSettings.accentColor = {
            "r": 50,
            "g": 50,
            "b": 50,
            "a": 0.9
        };
    }
    if (!clientSettings.hasOwnProperty("rainbowEnabled")) {
        clientSettings.rainbowEnabled = true;
    }
    if (!clientSettings.hasOwnProperty("devToolsOnStartup")) {
        clientSettings.devToolsOnStartup = false;
    }
    if (!clientSettings.hasOwnProperty("ip")) {
        clientSettings.ip = "0.0.0.0";
    }
    if (!clientSettings.hasOwnProperty("quality")) {
        clientSettings.quality = 5;
    }
    if (!clientSettings.hasOwnProperty("disableVideo")) {
        clientSettings.disableVideo = false;
    }
    if (!clientSettings.hasOwnProperty("disableAudio")) {
        clientSettings.disableAudio = false;
    }
    if (!clientSettings.hasOwnProperty("abxySwap")) {
        clientSettings.abxySwap = false;
    }
    if (!clientSettings.hasOwnProperty("limitFPS")) {
        clientSettings.limitFPS = false;
    }
    if (!clientSettings.hasOwnProperty("autoChangeResolution")) {
        clientSettings.autoChangeResolution = true;
    }
    if (!clientSettings.hasOwnProperty("encoding")) {
        clientSettings.encoding = "CPU";
    }
    if (!clientSettings.hasOwnProperty("mouseControl")) {
        clientSettings.mouseControl = "ANALOG";
    }
    if (!clientSettings.hasOwnProperty("firstInstall")) {
        clientSettings.firstInstall = false;
    }
    if (!clientSettings.hasOwnProperty("autoStartup")) {
        clientSettings.autoStartup = false;
    }

    applyClientSettings();
}
function loadClientSettings() {
    clientSettings = DB.load(clientSettingsPath);
    initSettings();
    saveClientSettings();
}

function applyClientSettings() {
    $("#debugEnabled").prop("checked", clientSettings.debug);
    $("#rainbowEnabled").prop("checked", clientSettings.rainbowEnabled);
    $("#devToolsOnStartup").prop("checked", clientSettings.devToolsOnStartup);
    $("#autoStart").prop("checked", clientSettings.autoStartStreamer);
    $("#autoStartup").prop("checked", clientSettings.autoStartup);
    $("#qualitySlider").val(clientSettings.quality);
    $('#qualityLabel').html("Quality: " + clientSettings.quality + "Mbps");
    $('#disableVideo').prop("checked", clientSettings.disableVideo);
    $('#disableAudio').prop("checked", clientSettings.disableAudio);
    $('#abxySwap').prop("checked", clientSettings.abxySwap);
    $('#limitFPS').prop("checked", clientSettings.limitFPS);
    $('#autoChangeResolution').prop("checked", clientSettings.autoChangeResolution);
    if (clientSettings.autoChangeResolution) {
        ipcRenderer.send("autoChangeResolutionOn");
    } else {
        ipcRenderer.send("autoChangeResolutionOff")
    }
    $("#ipInput").val(clientSettings.ip);
    if (clientSettings.encoding == "NVENC") {
        $("#encodingDrop").html("Encoding (Nvidia)");
    } else if(clientSettings.encoding == "AMDVCE"){
        $("#encodingDrop").html("Encoding (AMD)")
    } else if(clientSettings.encoding == "QSV"){
        $("#encodingDrop").html("Encoding (Intel)");
    } else {
        $("#encodingDrop").html("Encoding (CPU)");
        clientSettings.encoding = "CPU";
    }
    if (clientSettings.mouseControl == "ANALOG") {
        $("#mouseControlDrop").html("Mouse Control (Analog)");
    } else if (clientSettings.mouseControl == "GYRO") {
        $("#mouseControlDrop").html("Mouse Control (Gyro)");
    } else {
        $("#mouseControlDrop").html("Mouse Control (Analog)");
        clientSettings.mouseControl = "ANALOG";
    }
    if (clientSettings.debug) {
        $("#dev-btn").fadeIn(400);
        $("#rld-btn").fadeIn(400);
    } else {
        $("#dev-btn").fadeOut(400);
        $("#rld-btn").fadeOut(400);
    }
    if (clientSettings.rainbowEnabled) {
        rainbowAccent();
    } else {
        setAccentColor(clientSettings.accentColor.r, clientSettings.accentColor.g, clientSettings.accentColor.b, clientSettings.accentColor.a);
    }
    if (clientSettings.devToolsOnStartup) {
        openDevTools();
    }
    if (!clientSettings.firstInstall) {
        ipcRenderer.send('installScpVBus');
        ipcRenderer.send('installAudioDriver');
        // $('#restartModal').modal('show');
        clientSettings.firstInstall = true;
        saveClientSettings();
    }
    if (clientSettings.autoStartStreamer) {
        connect();
    }
    if (clientSettings.autoStartup) {
        ipcRenderer.send('autoStartupOn');
    } else {
        ipcRenderer.send('autoStartupOff');
    }
}

$("#rainbowEnabled").on('change', function () {
    clientSettings.rainbowEnabled = $("#rainbowEnabled").prop("checked");
    saveClientSettings();
    applyClientSettings();
});
// $("#debugEnabled").on('change', function () {
//     clientSettings.debug = $("#debugEnabled").prop("checked");
//     saveClientSettings();
//     applyClientSettings();
// });
// $("#devToolsOnStartup").on('change', function () {
//     clientSettings.devToolsOnStartup = $("#devToolsOnStartup").prop("checked");
//     saveClientSettings();
//     applyClientSettings();
// });

$("#autoStart").on('change', function () {
    clientSettings.autoStartStreamer = $("#autoStart").prop("checked");
    saveClientSettings();
    applyClientSettings();
}); $("#autoStartup").on('change', function () {
    clientSettings.autoStartup = $("#autoStartup").prop("checked");
    saveClientSettings();
    applyClientSettings();
});

$('#installScpVBusBtn').click(function () {
    ipcRenderer.send('installScpVBus');
});
$('#unInstallScpVBusBtn').click(function () {
    ipcRenderer.send('unInstallScpVBus');
});
$('#installAudioDriverBtn').click(function () {
    ipcRenderer.send('installAudioDriver');
});
$('#unInstallAudioDriverBtn').click(function () {
    ipcRenderer.send('unInstallAudioDriver');
});
var qualityChangeTimeout;
$(document).on('input', '#qualitySlider', function () {
    $('#qualityLabel').html("Quality: " + $(this).val() + "Mbps");
    clientSettings.quality = $(this).val();
    if (running) {
        clearTimeout(qualityChangeTimeout);
        qualityChangeTimeout = setTimeout(restart, 1000)
    }
    saveClientSettings();
});

$(document).on('input', '#ipInput', function () {
    clientSettings.ip = $(this).val();
    saveClientSettings();
});
$("#disableVideo").on('change', function () {
    clientSettings.disableVideo = $("#disableVideo").prop("checked");
    if (running) {
        restart();
    }
    saveClientSettings();
    applyClientSettings();
});
$("#disableAudio").on('change', function () {
    clientSettings.disableAudio = $("#disableAudio").prop("checked");
    if (running) {
        restart();
    }
    saveClientSettings();
    applyClientSettings();
});
$("#abxySwap").on('change', function () {
    clientSettings.abxySwap = $("#abxySwap").prop("checked");
    if (running) {
        restart();
    }
    saveClientSettings();
    applyClientSettings();
});
$("#limitFPS").on('change', function () {
    clientSettings.limitFPS = $("#limitFPS").prop("checked");
    if (running) {
        restart();
    }
    saveClientSettings();
    applyClientSettings();
});
$("#autoChangeResolution").on('change', function () {
    clientSettings.autoChangeResolution = $("#autoChangeResolution").prop("checked");
    saveClientSettings();
    applyClientSettings();
});

$("#settings-btn").click(function () {
    $(".contentArea").hide();
    $("#settings").fadeIn(400);
    $('#settings-btn').tooltip('hide');
});

function setEncoding(encoding) {
    clientSettings.encoding = encoding;
    if (running) {
        restart();
    }
    saveClientSettings();
    applyClientSettings();
}
function setMouseControl(mouseControl) {
    clientSettings.mouseControl = mouseControl;
    if (running) {
        restart();
    }
    saveClientSettings();
    applyClientSettings();
}
$("#restartBtn").click(function () {
    ipcRenderer.send('restartComputer');
});