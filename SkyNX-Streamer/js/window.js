//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const dialog = remote.dialog;
const fs = require('fs')
var DB = require('./Devlord_modules/DB.js');

document.getElementById("min-btn").addEventListener("click", function (e) {
    var window = remote.getCurrentWindow();
    window.minimize();
});
var isMaximized = false;
document.getElementById("max-btn").addEventListener("click", function (e) {
    var window = remote.getCurrentWindow();
    // !window.isMaximized()
    if (!isMaximized) {
        isMaximized = true;
        window.maximize();
    } else {
        isMaximized = false;
        window.unmaximize();
    }
});

document.getElementById("close-btn").addEventListener("click", function (e) {
    var window = remote.getCurrentWindow();
    window.close();
});

document.getElementById("dev-btn").addEventListener("click", function (e) {
    openDevTools();
});
function openDevTools() {
    var window = remote.getCurrentWindow();
    window.webContents.openDevTools();
}
document.getElementById("rld-btn").addEventListener("click", function (e) {
    location.reload();
});

window.addEventListener('load', function () {
    $("#loadingCover").fadeOut(1000);
})
