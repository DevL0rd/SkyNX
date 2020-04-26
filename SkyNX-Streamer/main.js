
const { spawn } = require("child_process");
const { exec } = require('child_process');
const elevate = require("windows-elevate");
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');
const DB = require('./Devlord_modules/DB.js');
const isDev = require('electron-is-dev');
var AutoLaunch = require('auto-launch');
var AU = require('ansi_up');
var ansi_up = new AU.default;
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron')
let mainWindow
var usingUI = true;
var minimizeToTray = false;
function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 500,
    defaultHeight: 400
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    // width: mainWindowState.width,
    // height: mainWindowState.height,
    width: 500,
    height: 320,
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
  // load the index.html of the app.
  mainWindow.loadFile('index.html');
  //fix transparency bug in windows 10
  mainWindow.reload();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
    try {
      streamerProcess.kill();
    } catch (error) {

    }
  });
  // mainWindow.on('minimize', function (event) {
  //   if (minimizeToTray) {
  //     event.preventDefault();
  //     mainWindow.hide();
  //   }
  // })
  // var iconPath = "icon.ico";
  // if (isDev) {
  //   iconPath = __dirname + "/resources/app/icon.ico"
  // }
  // var appIcon = new Tray(iconPath)
  // var contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Show App', click: function () {
  //       mainWindow.show();
  //     }
  //   },
  //   {
  //     label: 'Quit', click: function () {
  //       application.isQuiting = true;
  //       application.quit();
  //     }
  //   }
  // ]);
  // appIcon.setContextMenu(contextMenu);
  mainWindow.on('show', function () {
    appIcon.setHighlightMode('always');
  });
}
app.on('ready', function () { if (usingUI) setTimeout(createWindow, 300); });

// Quit when all windows are closed.
app.on('window-all-closed', function () {
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
var streamerProcessIsRunning = false;
function startStreamer(arg) {
  var cwd = './NxStreamingService/';
  if (!isDev) {
    cwd = "./resources/app/NxStreamingService"
  }
  var args = ["/ip", arg.ip, "/q", arg.q];
  if (arg.disableVideo) {
    args.push("/noVideo");
  }
  if (arg.disableAudio) {
    args.push("/noAudio");
  }
  if (arg.abxySwap) {
    args.push("/abxySwap");
  }
  if (arg.encoding == "NVENC") {
    args.push("/e");
    args.push("NVENC");
  }

  streamerProcess = spawn(
    "./NxStreamingService.exe",
    args,
    { cwd: cwd, stdio: "pipe" }
  );

  streamerProcess.stdout.on("data", data => {
    log(`${data}`);
    if (!streamerProcessIsRunning) {
      streamerProcessIsRunning = true;
      clientSender.send("started");
    }
  });
  streamerProcess.stderr.on('data', (data) => {
    log(`${data}`);
    if (!streamerProcessIsRunning) {
      streamerProcessIsRunning = true;
      clientSender.send("started");
    }
  });
  streamerProcess.on('close', (code) => {
    clientSender.send("close");
    log(`streamerProcess process exited with code ${code}`);
    streamerProcessIsRunning = false;
  });
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

ipcMain.on('donate', (event, fullMessage) => {
  var url = 'https://www.paypal.me/SkyNX';
  var start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
  require('child_process').exec(start + ' ' + url);
})
var autoLauncher = new AutoLaunch({
  name: 'SkyNX',
  path: __dirname.replace("resources\\app\\", "") + '\\SkyNXStreamer.exe',
});
ipcMain.on('autoStartupOn', (event, fullMessage) => {
  if (!autoLauncher.isEnabled) {
    autoLauncher.enable();
  }
});
ipcMain.on('autoStartupOff', (event, fullMessage) => {
  if (autoLauncher.isEnabled) {
    autoLauncher.disable();
  }
});