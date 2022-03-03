//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
document.getElementById("min-btn").addEventListener("click", function (e) {
    ipcRenderer.send('min');
});

// document.getElementById("max-btn").addEventListener("click", function (e) {
//     ipcRenderer.send('max');
// });

document.getElementById("close-btn").addEventListener("click", function (e) {
    ipcRenderer.send('close');
});

document.getElementById("dev-btn").addEventListener("click", function (e) {
    openDevTools();
});
function openDevTools() {
    ipcRenderer.send('devTools');
}
document.getElementById("rld-btn").addEventListener("click", function (e) {
    location.reload();
});

window.addEventListener('load', function () {
    $("#loadingCover").fadeOut(1000);
})
