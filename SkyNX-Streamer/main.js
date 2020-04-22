
const { spawn } = require("child_process");
const elevate = require("windows-elevate");
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');
const DB = require('./Devlord_modules/DB.js');
var AU = require('ansi_up');
var ansi_up = new AU.default;
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var usingUI = true;

function createWindow() {
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 350,
    defaultHeight: 250
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    // width: mainWindowState.width,
    // height: mainWindowState.height,
    width: 400,
    height: 280,
    // minWidth: 350,
    // minHeight: 300,
    webPreferences: {
      nodeIntegration: true
    },
    transparent: true,
    resizable: false,
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
    try {
      streamerProcess.kill();
    } catch (error) {

    }
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
  streamerProcess.kill();
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

app.on('browser-window-created', function (e, window) {
  window.setMenu(null);
});
var streamerProcess;
var clientSender;
function startStreamer(arg) {
  streamerProcess = spawn(
    "./NxStreamingService.exe",
    ["/ip", arg.ip, "/q", arg.q],
    { cwd: './NxStreamingService/', stdio: "pipe" }
  );
  streamerProcess.stdout.on("data", data => {
    log(`${data}`);
  });
  streamerProcess.stderr.on('data', (data) => {
    console.error(`streamerProcess Error: ${data}`);
  });
  streamerProcess.on('close', (code) => {
    clientSender.send("close");
    log(`streamerProcess process exited with code ${code}`);
  });
  clientSender.send("started");
}
ipcMain.on('connect', (event, arg) => {
  clientSender = event.sender;
  startStreamer(arg);
})

ipcMain.on('restart', (event, arg) => {
  streamerProcess.kill();
  startStreamer(arg);
});
ipcMain.on('kill', (event, arg) => {
  streamerProcess.kill();
});
ipcMain.on('installScpVBus', (event, arg) => {
  log("Installing ScpVBus driver..")
  var df = __dirname + "\\NxStreamingService\\lib\\"
  elevate.exec(df + "devcon.exe", ["install", df + "ScpVBus.inf", "Root\\ScpVBus"],
    function (error, stdout, stderr) {
      log(`${stdout}`);
      log(`${stderr}`);
      if (error) {
        log("driver install error: " + error);
      } else {
        log("Driver installed!");
      }
    });
});
ipcMain.on('unInstallScpVBus', (event, arg) => {
  log("Un-Installing ScpVBus driver..")
  var df = __dirname + "\\NxStreamingService\\lib\\"
  elevate.exec(df + "devcon.exe", ["remove", "Root\\ScpVBus"],
    function (error, stdout, stderr) {
      if (error !== null) {
        log('driver uninstall error: ' + error);
      } else {
        log("Driver un-installed!");
      }
    });

});

ipcMain.on('installAudioDriver', (event, arg) => {
  log("Installing audio driver..")
  var df = __dirname + "\\NxStreamingService\\lib\\"
  elevate.exec("regsvr32", [df + "audio_sniffer.dll"],
    function (error, stdout, stderr) {
      if (error !== null) {
        log('driver install error: ' + error);
      } else {
        log("Driver installed!");
      }
    });
});
ipcMain.on('unInstallAudioDriver', (event, arg) => {
  log("Un-Installing audio driver..")
  var df = __dirname + "\\NxStreamingService\\lib\\"
  elevate.exec("regsvr32", ["/u", df + "audio_sniffer.dll"],
    function (error, stdout, stderr) {
      if (error !== null) {
        log('driver uninstall error: ' + error);
      } else {
        log("Driver un-installed!");
      }
    });
});

var htmlLoggingSender
ipcMain.on('registerForHTMLLogging', (event, arg) => {
  htmlLoggingSender = event.sender
})

ipcMain.on('consoleCommand', (event, fullMessage) => {
  var args = fullMessage.split(" ");
  var command = args.shift().toLowerCase();
  //Will add later
})

function log(str) {
  console.log(str);
  if (htmlLoggingSender) {
    htmlLoggingSender.send('log', ansi_up.ansi_to_html(str.replace("  ", "\xa0")) + "<br>");
  }
}