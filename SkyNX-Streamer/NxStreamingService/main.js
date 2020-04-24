//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
const { spawn } = require("child_process");
const DB = require('./Devlord_modules/DB.js');
const Struct = require('struct');
const net = require('net');
const robot = require("robotjs");
const VGen = require("vgen-xbox")
const vgen = new VGen();
var ip = "0.0.0.0"
var quality = 5;
var screenSize = robot.getScreenSize();
var sheight = screenSize.height;
var swidth = screenSize.width;
var hidStreamClient = new net.Socket();
var usingVideo = true;
function connect() {
  hidStreamClient.connect({
    host: ip,
    port: 2223
  });
}

var ffmpegProcess;
var ffmpegAudioProcess;

hidStreamClient.on('error', function (ex) {
  if (ex) {
    console.log("Could not connect to Switch. Connection timed out...");
    setTimeout(connect, 1000);
  }
});
var controllerIds = [];
function plugControllerIn() {
  try {
    var nCid = vgen.pluginNext();
    controllerIds.push(nCid);
    console.log("Plugged in controller " + nCid + ".");
  }
  catch (e) {
    console.log("Could not plug in virtual controller. Make sure the driver is installed.");
    setTimeout(plugControllerIn, 3000);
  }
}

function startAudioProcess() {
  ffmpegAudioProcess = spawn(
    "./lib/ffmpeg.exe",
    ["-y", "-f", "dshow", "-i", 'audio=virtual-audio-capturer', "-af", "equalizer=f=100:t=h:width=10:g=-64", "-f", "s16le", "-ar", "16000", "-ac", "2", "-c:a", "pcm_s16le", "udp://" + ip + ":2224?pkt_size=640"],
    { detached: false }
  );
  ffmpegAudioProcess.stdout.on("data", data => {
    console.log(`${data}`);
  });
  ffmpegAudioProcess.stderr.on('data', (data) => {
    console.error(`${data}`);
  });
  ffmpegAudioProcess.on('close', (code) => {
    console.log(`AudioProcess process exited with code ${code}`);
  });
}
function startVideoProcess() {
  var cpuh264 = ["-probesize", "50M", "-threads", "0", "-f", "gdigrab", "-framerate", "60", "-video_size", swidth + "x" + sheight, "-offset_x", "0", "-offset_y", "0", "-show_region", "0", "-draw_mouse", "1", "-i", "desktop", "-f", "h264", "-vf", "scale=1280x720", "-preset", "ultrafast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-x264-params", 'nal-hrd=cbr', "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / 2) + "M", "tcp://" + ip + ":2222"];
  var h264_nvenc_ARGS = ["-probesize", "10M", "-f", "gdigrab", "-framerate", "80", "-video_size", swidth + "x" + sheight, "-offset_x", "0", "-offset_y", "0", "-i", "desktop", "-c:v", "h264_nvenc", "-gpu", "0", "-rc", "cbr_ld_hq", "-zerolatency", "true", "-f", "h264", "-vf", "scale=1280x720", "-preset", "losslesshp", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "tcp://" + ip + ":2222"];
  ffmpegProcess = spawn(
    "./lib/ffmpeg.exe",
    cpuh264,
    {
      detached: false
    }
  );
  ffmpegProcess.stdout.on("data", data => {
    console.log(`${data}`);
  });
  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`${data}`);
  });
  ffmpegProcess.on('close', (code) => {
    console.log(`VideoProcess process exited with code ${code}`);
  });
}
hidStreamClient.on('connect', function () {
  console.log('Connected to Switch!');
  startVideoProcess();
  startAudioProcess();
});
var switchHidBuffer = new Buffer.alloc(0);
function parseInputStruct(buff) {
  var input = Struct()
    .word64Ule('HeldKeys1')
    .word16Ule('LJoyX1')
    .word16Ule('LJoyY1')
    .word16Ule('RJoyX1')
    .word16Ule('RJoyY1')
    .word64Ule('HeldKeys2')
    .word16Ule('LJoyX2')
    .word16Ule('LJoyY2')
    .word16Ule('RJoyX2')
    .word16Ule('RJoyY2')
    .word64Ule('HeldKeys3')
    .word16Ule('LJoyX3')
    .word16Ule('LJoyY3')
    .word16Ule('RJoyX3')
    .word16Ule('RJoyY3')
    .word64Ule('HeldKeys4')
    .word16Ule('LJoyX4')
    .word16Ule('LJoyY4')
    .word16Ule('RJoyX4')
    .word16Ule('RJoyY4')
    .word16Ule('touchX')
    .word16Ule('touchY')
    .word16Ule('controllerCount')
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
var touchXold;
var touchYold;
var mouseIsDown = false;
function handleControllerInput(hid, controllerId, playerNumber) {
  var heldKeys = hid.get("HeldKeys" + playerNumber);
  var LJoyX = hid.get("LJoyX" + playerNumber);
  var LJoyY = hid.get("LJoyY" + playerNumber);
  var RJoyX = hid.get("RJoyX" + playerNumber);
  var RJoyY = hid.get("RJoyY" + playerNumber);
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

}
hidStreamClient.on('data', function (data) {
  switchHidBuffer = new Buffer.from(data);
  var hid = parseInputStruct(switchHidBuffer)
  var controllerCount = hid.get("controllerCount");
  if (controllerCount > controllerIds.length) {
    plugControllerIn();
  }
  for (i in controllerIds) {
    handleControllerInput(hid, controllerIds[i], parseInt(i) + 1);
  }
  var touchX = hid.get("touchX");
  var touchY = hid.get("touchY");
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
    for (i in controllerIds) {
      vgen.unplug(controllerIds[i]);
    }
    controllerIds = [];
  } catch (error) {

  }
  ffmpegProcess.kill();
  ffmpegAudioProcess.kill();
  setTimeout(connect, 1000);
});


var args = process.argv.slice(" ");

if (args.length > 1) {
  if (args.includes("/ip") && args[args.indexOf("/ip") + 1]) {
    ip = args[args.indexOf("/ip") + 1];
    console.log('Waiting for connection...');
    if (args.includes("/q") && args[args.indexOf("/q") + 1]) {
      quality = args[args.indexOf("/q") + 1];
    } else {
      quality = 5;
    }
    if (args.includes("/noVideo")) {
      usingVideo = false;
    } else {
      usingVideo = true;
    }
    connect();
  } else {
    console.log('Error: Usage NXStreamer.exe ip 0.0.0.0 q 5');
  }
} else {
  console.log('Error: Usage NXStreamer.exe ip 0.0.0.0 q 5');
}
