//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
const { spawn } = require("child_process");
const DB = require('./Devlord_modules/DB.js');
const Struct = require('struct');
const net = require('net');
const robot = require("robotjs");
const VGen = require("vgen-xbox")
const vgen = new VGen();
const cc = require('./Devlord_modules/conColors.js');
const cs = require('./Devlord_modules/conSplash.js');

var screenSize = robot.getScreenSize();
var sheight = screenSize.height;
var swidth = screenSize.width;
var hidStreamClient = new net.Socket();
function connect(address) {
  hidStreamClient.connect({
    host: "172.16.0.10",
    port: 2223
  });
}

var controllerId = 1;
var ffmpegProcess;
var ffmpegAudioProcess;

hidStreamClient.on('error', function (ex) {
  if (ex) {
    console.log("Could not connect to Switch. Connection timed out...")
    setTimeout(connect, 1000);
  }
});
hidStreamClient.on('connect', function () {
  console.log('Connected to Switch!');
  try {
    // Try plugging in first controller
    controllerId = vgen.pluginNext();
  }
  catch (e) {
    // Exception most probably due to drivers not installed
    vgen.installDriver(() => {
      vgen.plugin(controllerId);
    });
  }
  ffmpegProcess = spawn(
    "./ffmpeg.exe",
    ["-probesize", "10M", "-f", "gdigrab", "-framerate", "60", "-video_size", swidth + "x" + sheight, "-offset_x", "0", "-offset_y", "0", "-i", "desktop", "-f", "h264", "-vf", "scale=1280x720", "-preset", "ultrafast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-x264-params", "\"nal-hrd=cbr\"", "-b:v", "5M", "-minrate", "5M", "-maxrate", "5M", "-bufsize", "2M", "tcp://172.16.0.10:2222"],
    { stdio: "pipe" }
  );

  ffmpegProcess.stdout.on("data", chunk => {

  });

  ffmpegProcess.stderr.on('data', (data) => {
    //console.error(`stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`ffmpegProcess process exited with code ${code}`);
  });



  ffmpegAudioProcess = spawn(
    "./ffmpeg.exe",
    ["-y", "-f", "dshow", "-i", "audio=virtual-audio-capturer", "-f", "s16le", "-ar", "16000", "-ac", "2", "-c:a", "pcm_s16le", "udp://172.16.0.10:2224?pkt_size=640"],
    { stdio: "pipe" }
  );
  ffmpegAudioProcess.stdout.on("data", chunk => {
    //videoStreamClient.write(chunk);
  });

  ffmpegAudioProcess.stderr.on('data', (data) => {
    //console.error(`stderr: ${data}`);
  });

  ffmpegAudioProcess.on('close', (code) => {
    console.log(`ffmpegAudioProcess process exited with code ${code}`);
  });

});
var switchHidBuffer = new Buffer.alloc(0);
function parseInputStruct(buff) {
  var input = Struct()
    .word64Ule('HeldKeys')
    .word16Ule('LJoyX')
    .word16Ule('LJoyY')
    .word16Ule('RJoyX')
    .word16Ule('RJoyY')
    .word16Ule('touchX')
    .word16Ule('touchY')
  input._setBuff(buff);
  return input;
};
function isOdd(int) {
  return (int & 1) === 1;
}
function heldKeysBitmask(HeldKeys) {
  return {
    A: isOdd(HeldKeys >> 0),
    B: isOdd(HeldKeys >> 1),
    X: isOdd(HeldKeys >> 2),
    Y: isOdd(HeldKeys >> 3),
    LS: isOdd(HeldKeys >> 4),
    RS: isOdd(HeldKeys >> 5),
    L: isOdd(HeldKeys >> 6),
    R: isOdd(HeldKeys >> 7),
    ZL: isOdd(HeldKeys >> 8),
    ZR: isOdd(HeldKeys >> 9),
    Plus: isOdd(HeldKeys >> 10),
    Minus: isOdd(HeldKeys >> 11),
    Left: isOdd(HeldKeys >> 12),
    Up: isOdd(HeldKeys >> 13),
    Right: isOdd(HeldKeys >> 14),
    Down: isOdd(HeldKeys >> 15)
  }
}
var heldKeysOld;
var LJoyXold;
var LJoyYold;
var RJoyXold;
var RJoyYold;
var touchXold;
var touchYold;
var mouseIsDown = false;
hidStreamClient.on('data', function (data) {
  //logDataStream(data)
  //buffer2 = new Buffer.from(data, "hex");

  switchHidBuffer = new Buffer.from(data);
  var hid = parseInputStruct(switchHidBuffer)
  var heldKeys = hid.get("HeldKeys");
  var touchX = hid.get("touchX");
  var touchY = hid.get("touchY");
  var LJoyX = hid.get("LJoyX");
  var LJoyY = hid.get("LJoyY");
  var RJoyX = hid.get("RJoyX");
  var RJoyY = hid.get("RJoyY");
  if (LJoyX != LJoyXold || LJoyY != LJoyYold) {
    var nljx;
    var nljy;
    if (LJoyX) {
      nljx = LJoyX / 32767.5
    }
    if (nljx > 1) {
      nljx = 2 - nljx
      nljx = -nljx
    }

    if (LJoyY) {
      nljy = LJoyY / 32767.5
    }
    if (nljy > 1) {
      nljy = 2 - nljy
      nljy = -nljy
    }
    vgen.setAxisL(controllerId, nljx, nljy);
    LJoyXold = LJoyX;
    LJoyYold = LJoyY;
  }
  if (RJoyX != RJoyXold || RJoyY != RJoyYold) {
    var nrjx;
    var nrjy;
    if (RJoyX) {
      nrjx = RJoyX / 32767.5
    }
    if (nrjx > 1) {
      nrjx = 2 - nrjx
      nrjx = -nrjx
    }

    if (RJoyY) {
      nrjy = RJoyY / 32767.5
    }
    if (nrjy > 1) {
      nrjy = 2 - nrjy
      nrjy = -nrjy
    }
    vgen.setAxisR(controllerId, nrjx, nrjy);
    RJoyXold = RJoyX;
    RJoyYold = RJoyY;
  }
  if (heldKeys != heldKeysOld) {
    var inputStates = heldKeysBitmask(heldKeys);
    //Button mapping
    vgen.setButton(controllerId, vgen.Buttons.B, inputStates.A);
    vgen.setButton(controllerId, vgen.Buttons.A, inputStates.B);
    vgen.setButton(controllerId, vgen.Buttons.X, inputStates.Y);
    vgen.setButton(controllerId, vgen.Buttons.Y, inputStates.X);
    vgen.setButton(controllerId, vgen.Buttons.BACK, inputStates.Minus);
    vgen.setButton(controllerId, vgen.Buttons.START, inputStates.Plus);
    vgen.setButton(controllerId, vgen.Buttons.LEFT_SHOULDER, inputStates.L);
    vgen.setButton(controllerId, vgen.Buttons.RIGHT_SHOULDER, inputStates.R);
    vgen.setButton(controllerId, vgen.Buttons.LEFT_THUMB, inputStates.LS);
    vgen.setButton(controllerId, vgen.Buttons.RIGHT_THUMB, inputStates.RS);
    //Trigger Mapping
    if (inputStates.ZL) {
      vgen.setTriggerL(controllerId, 1);
    } else {
      vgen.setTriggerL(controllerId, 0);
    }
    if (inputStates.ZR) {
      vgen.setTriggerR(controllerId, 1);
    } else {
      vgen.setTriggerR(controllerId, 0);
    }
    //Dpad mapping
    if (inputStates.Up || inputStates.Down || inputStates.Left || inputStates.Right) {
      if (inputStates.Up) {
        if (inputStates.Left || inputStates.Right) {
          if (inputStates.Left) {
            vgen.setDpad(controllerId, vgen.Dpad.UP_LEFT);
          } else {
            vgen.setDpad(controllerId, vgen.Dpad.UP_RIGHT);
          }
        } else {
          vgen.setDpad(controllerId, vgen.Dpad.UP);
        }
      } else if (inputStates.Down) {
        if (inputStates.Left || inputStates.Right) {
          if (inputStates.Left) {
            vgen.setDpad(controllerId, vgen.Dpad.DOWN_LEFT);
          } else {
            vgen.setDpad(controllerId, vgen.Dpad.DOWN_RIGHT);
          }
        } else {
          vgen.setDpad(controllerId, vgen.Dpad.DOWN);
        }
      } else if (inputStates.Left) {
        vgen.setDpad(controllerId, vgen.Dpad.LEFT);
      } else if (inputStates.Right) {
        vgen.setDpad(controllerId, vgen.Dpad.RIGHT);
      }
    } else {
      vgen.setDpad(controllerId, vgen.Dpad.NONE);
    }
    heldKeysOld = heldKeys;
  }
  if (touchX != touchXold || touchY != touchYold) {
    if (touchX && touchY) {
      touchX -= 15;
      touchY -= 15;
      var posXPercent = touchX / 1249
      var posYPercent = touchY / 689
      var posX = Math.floor(swidth * posXPercent)
      var posY = Math.floor(sheight * posYPercent)
      robot.moveMouse(posX, posY);
      if (!mouseIsDown) {
        robot.mouseToggle("down");
        mouseIsDown = true;
      }
      touchTime++;
    } else {
      if (mouseIsDown) {
        robot.mouseToggle("up");
        mouseIsDown = false;
      }
      touchTime = 0;
    }
    touchXold = touchX;
    touchYold = touchY;
  }
});
hidStreamClient.on('end', function () {
  console.log('hidStreamClient Disconnected.');
  try {
    vgen.unplug(controllerId);
  } catch (error) {

  }
  ffmpegProcess.kill();
  ffmpegAudioProcess.kill();
  connect();
});

connect();

module.exports.init = connect







