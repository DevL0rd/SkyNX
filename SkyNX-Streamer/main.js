

const DB = require('./Devlord_modules/DB.js');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var args = process.argv.slice(5);
var usingUI = true;
var mainServerIp = false;
if (args.length > 1) {
  var workerParams = {};
  if (args.includes("worker")) {
    mainServerIp = args[args.indexOf("worker") + 1];
    if (mainServerIp) {
      workerParams = { mainServerIp: mainServerIp, password: args[args.indexOf("worker") + 2], isWorker: true };
    }
  }
  if (args.includes("noui") || args.includes("worker")) {
    if (mws.init(args[0], workerParams)) {
      usingUI = false;
    }
  }
}
function createWindow() {
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 720,
    defaultHeight: 500
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 720,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true
    },
    transparent: true,
    resizable: true,
    frame: false
  })
  mainWindowState.manage(mainWindow);
  mainWindow.setMenu(null);
  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
  //fix transparency bug in windows 10
  mainWindow.reload();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () { if (usingUI) setTimeout(createWindow, 300); });

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

app.on('browser-window-created', function (e, window) {
  window.setMenu(null);
});

var htmlLoggingSender

ipcMain.on('exampleMessage', (event, arg) => {

})
