//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
const { spawn } = require("child_process");
const DB = require('./Devlord_modules/DB.js');
const Struct = require('struct');
const net = require('net');
const robot = require("robotjs");
const VGen = require("vgen-xbox")
const vgen = new VGen();
const GyroServ = require("./Devlord_modules/GyroServ.js");
var ip = "0.0.0.0"
var quality = 5;
var hidStreamClient = new net.Socket();
var usingVideo = true;
var usingAudio = true;
var abxySwap = false;
var limitFPS = false;
var encoding = "CPU";
var screenWidth = 1280;
var screenHeight = 720;
var screenScale = 1;
var mouseControl = "TOUCH";
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
    ["-y", "-f", "dshow", "-i", 'audio=virtual-audio-capturer', "-f", "s16le", "-ar", "16000", "-ac", "2", "-c:a", "pcm_s16le", "udp://" + ip + ":2224?pkt_size=640"],
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
  var fps = 60;
  if (limitFPS) {
    fps = 30;
  }
  var ffmpegVideoArgs = [];
  if (encoding == "NVENC") {
    ffmpegVideoArgs = ["-probesize", "50M", "-hwaccel", "auto", "-f", "gdigrab", "-framerate", fps, "-video_size", screenWidth + "x" + screenHeight, "-offset_x", "0", "-offset_y", "0", "-draw_mouse", "1", "-i", "desktop", "-c:v", "h264_nvenc", "-gpu", "0", "-rc", "cbr_ld_hq", "-zerolatency", "1", "-f", "h264", "-vf", "scale=1280x720", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-cq:v", "19", "-g", "999999", "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / (fps / 4)) + "M", "tcp://" + ip + ":2222"];
    console.log("Using Nvidia Encoding");
  } else {
    ffmpegVideoArgs = ["-probesize", "50M", "-hwaccel", "auto", "-f", "gdigrab", "-framerate", fps, "-video_size", screenWidth + "x" + screenHeight, "-offset_x", "0", "-offset_y", "0", "-draw_mouse", "1", "-i", "desktop", "-f", "h264", "-vf", "scale=1280x720", "-preset", "ultrafast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-x264-params", 'nal-hrd=cbr', "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / 2) + "M", "tcp://" + ip + ":2222"];
    console.log("Using CPU Encoding");
  }
  ffmpegProcess = spawn(
    "./lib/ffmpeg.exe",
    ffmpegVideoArgs,
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
  if (usingVideo) {
    startVideoProcess();
  }
  if (usingAudio) {
    startAudioProcess();
  }
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
    .word16Ule('touchX1')
    .word16Ule('touchY1')
    .word16Ule('touchX2')
    .word16Ule('touchY2')
    .floatle('accelX')
    .floatle('accelY')
    .floatle('accelZ')
    .floatle('gyroX')
    .floatle('gyroY')
    .floatle('gyroZ')
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
  if (!abxySwap) {
    vgen.setButton(controllerId, vgen.Buttons.B, inputStates.A);
    vgen.setButton(controllerId, vgen.Buttons.A, inputStates.B);
    vgen.setButton(controllerId, vgen.Buttons.X, inputStates.Y);
    vgen.setButton(controllerId, vgen.Buttons.Y, inputStates.X);
  } else {
    vgen.setButton(controllerId, vgen.Buttons.B, inputStates.B);
    vgen.setButton(controllerId, vgen.Buttons.A, inputStates.A);
    vgen.setButton(controllerId, vgen.Buttons.X, inputStates.X);
    vgen.setButton(controllerId, vgen.Buttons.Y, inputStates.Y);
  }

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
var touchX1old = 0;
var touchY1old = 0;

var leftClicking = false;
var rightTouchTime = 0;
var leftTouchTime = 0;
var rightClicking = false;
var scrolling = false;
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
  var gyro = { x: hid.get("gyroX"), y: hid.get("gyroY"), z: hid.get("gyroZ") }
  if (mouseControl == "ANALOG") {
    var RJoyX = hid.get("RJoyX1");
    var RJoyY = hid.get("RJoyY1");
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
    var mouse = robot.getMousePos();
    mx = mouse.x + (nrjx * 16);
    my = mouse.y - (nrjy * 16);
    if (mx && my) {
      robot.moveMouse(mx, my);
    }
    var heldKeys = hid.get("HeldKeys1");
    var inputStates = heldKeysBitmask(heldKeys);
    if (inputStates.ZR) {
      if (!leftClicking) {
        robot.mouseToggle("down");
        leftClicking = true;
      }
    } else {
      if (leftClicking) {
        robot.mouseToggle("up");
        leftClicking = false;
      }
    }
    if (inputStates.ZL) {
      if (!rightClicking) {
        robot.mouseToggle("down", "right");
        rightClicking = true;
      }
    } else {
      if (rightClicking) {
        robot.mouseToggle("up", "right");
        rightClicking = false;
      }
    }
  } else if (mouseControl == "GYRO") {
    var mouse = robot.getMousePos();
    var ngx = gyro.x * -1;
    var ngz = gyro.z * -1
    mx = mouse.x + (ngz * ((screenWidth) / 3));
    my = mouse.y + (ngx * ((screenHeight) / 2));
    if (mx && my) {
      robot.moveMouse(mx, my);
    }
    var heldKeys = hid.get("HeldKeys1");
    var inputStates = heldKeysBitmask(heldKeys);
    if (inputStates.ZR) {
      if (!leftClicking) {
        robot.mouseToggle("down");
        leftClicking = true;
      }
    } else {
      if (leftClicking) {
        robot.mouseToggle("up");
        leftClicking = false;
      }
    }
    if (inputStates.R) {
      if (!rightClicking) {
        robot.mouseToggle("down", "right");
        rightClicking = true;
      }
    } else {
      if (rightClicking) {
        robot.mouseToggle("up", "right");
        rightClicking = false;
      }
    }
  } else {
    var touchX1 = hid.get("touchX1");
    var touchY1 = hid.get("touchY1");
    if (touchX1 && touchY1) {
      touchX1 -= 15;
      touchY1 -= 15;
      touchX1 = Math.floor(screenWidth * (touchX1 / 1280))
      touchY1 = Math.floor(screenHeight * (touchY1 / 720))
      var touchX2 = hid.get("touchX2");
      var touchY2 = hid.get("touchY2");
      if (touchX2 && touchY2) {
        rightTouchTime++;
        if (rightTouchTime > 5) { //Handle scrolling
          if (!touchX1old) touchX1old = touchX1;
          if (!touchY1old) touchY1old = touchY1;
          var xDiff = touchX1old - touchX1;
          var yDiff = touchY1old - touchY1;
          robot.scrollMouse(xDiff, yDiff);
          touchX1old = touchX1;
          touchY1old = touchY1;
          scrolling = true;
          rightClicking = false;
        } else { //Handle left click
          rightClicking = true;
        }
      } else {
        if (rightClicking) {
          robot.mouseClick("right");
          rightClicking = false
        }
        scrolling = false;
        rightTouchTime = 0;
      }
      if (!scrolling) {
        leftTouchTime++;
        robot.moveMouse(touchX1 / screenScale, touchY1 / screenScale);
        if (!leftClicking) {
          robot.mouseToggle("down");
          leftClicking = true;
        }
      } else {
        robot.mouseToggle("up");
        leftClicking = false;
      }
    } else {
      if (leftClicking) { //release left click
        robot.mouseToggle("up");
        leftClicking = false;
        if (leftTouchTime < 3) {
          robot.mouseClick("left", true); //double click
        }
      }
      leftTouchTime = 0;
      rightTouchTime = 0;
    }
  }
  for (axis in gyro) {
    gyro[axis] *= 250;
  }
  gyro.y *= -1;
  var accel = { x: hid.get("accelX"), y: hid.get("accelY"), z: hid.get("accelZ") }
  GyroServ.sendMotionData(gyro, accel);

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
  if (usingVideo) {
    ffmpegProcess.kill();
  }
  if (usingAudio) {
    ffmpegAudioProcess.kill();
  }
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
    if (args.includes("/w") && args[args.indexOf("/w") + 1]) {
      screenWidth = args[args.indexOf("/w") + 1];
    } else {
      screenWidth = 1280;
    }
    if (args.includes("/h") && args[args.indexOf("/h") + 1]) {
      screenHeight = args[args.indexOf("/h") + 1];
    } else {
      screenHeight = 720;
    }
    if (args.includes("/s") && args[args.indexOf("/s") + 1]) {
      screenScale = args[args.indexOf("/s") + 1];
    } else {
      screenScale = 1;
    }
    if (args.includes("/m") && args[args.indexOf("/m") + 1]) {
      mouseControl = args[args.indexOf("/m") + 1];
    } else {
      mouseControl = "TOUCH";
    }
    if (args.includes("/noVideo")) {
      usingVideo = false;
    } else {
      usingVideo = true;
    }
    if (args.includes("/noAudio")) {
      usingAudio = false;
    } else {
      usingAudio = true;
    }
    if (args.includes("/abxySwap")) {
      abxySwap = true;
    } else {
      abxySwap = false;
    }
    if (args.includes("/abxySwap")) {
      abxySwap = true;
    } else {
      abxySwap = false;
    }
    if (args.includes("/limitFPS")) {
      limitFPS = true;
    } else {
      limitFPS = false;
    }
    if (args.includes("/e") && args[args.indexOf("/e") + 1]) {
      encoding = args[args.indexOf("/e") + 1];
    } else {
      encoding = "CPU";
    }
    connect();
  } else {
    console.log('Error: Usage NXStreamer.exe ip 0.0.0.0 q 10 /noVideo /noAudio /abxySwap /e NVCENC');
  }
} else {
  console.log('Error: Usage NXStreamer.exe ip 0.0.0.0 q 10 /noVideo /noAudio /abxySwap /e NVCENC');
}
