
var debug = true;
var clientSettings = {
    "debug": false,
    "accentColor": {
        "r": 50,
        "g": 50,
        "b": 50,
        "a": 0.9
    },
    "rainbowEnabled": true,
    "devToolsOnStartup": false,
    "ip": "172.16.0.10",
    "quality": 5
};
var clientSettingsPath = "./settings.json";
if (fs.existsSync(clientSettingsPath)) {
    loadClientSettings();
} else {
    DB.save(clientSettingsPath, clientSettings)
}
var saveSettingsTO
function saveClientSettingsTimeout() {
    clearTimeout(saveSettingsTO);
    saveSettingsTO = setTimeout(saveClientSettings, 500);
}
function saveClientSettings() {
    verifySettings();
    DB.save(clientSettingsPath, clientSettings);
}
function verifySettings() {

}
function loadClientSettings() {
    clientSettings = DB.load(clientSettingsPath)
    $("#debugEnabled").prop("checked", clientSettings.debug);
    $("#rainbowEnabled").prop("checked", clientSettings.rainbowEnabled);
    $("#devToolsOnStartup").prop("checked", clientSettings.devToolsOnStartup);
    $("#qualitySlider").val(clientSettings.quality);
    $('#qualityLabel').html("Quality: " + clientSettings.quality + "M");
    $("#ipInput").val(clientSettings.ip);
    applyClientSettings();
    if (clientSettings.devToolsOnStartup) {
        openDevTools();
    }
}

function applyClientSettings() {
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