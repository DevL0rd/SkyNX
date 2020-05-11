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
var mouseControl = "ANALOG";
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
  if (encoding == "NVENC") { //Nvidia Encoding
    ffmpegVideoArgs = ["-probesize", "50M", "-hwaccel", "auto", "-f", "gdigrab", "-framerate", fps, "-video_size", screenWidth + "x" + screenHeight, "-offset_x", "0", "-offset_y", "0", "-draw_mouse", "1", "-i", "desktop", "-c:v", "h264_nvenc", "-gpu", "0", "-rc", "cbr_ld_hq", "-zerolatency", "1", "-f", "h264", "-vf", "scale=1280x720", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-cq:v", "19", "-g", "999999", "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / (fps / 4)) + "M", "tcp://" + ip + ":2222"];
    console.log("Using Nvidia Encoding");
  } else if (encoding == "AMDVCE") { //AMD Video Coding Engine
    ffmpegVideoArgs = ["-probesize", "50M", "-hwaccel", "auto", "-f", "gdigrab", "-framerate", fps, "-video_size", screenWidth + "x" + screenHeight, "-offset_x", "0", "-offset_y", "0", "-draw_mouse", "1", "-i", "desktop", "-f", "h264", "-c:v", "h264_amf", "-usage", "1", "-rc", "cbr", "-vf", "scale=1280x720", "-pix_fmt", "yuv420p", "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / (fps / 4)) + "M", "tcp://" + ip + ":2222"];
    console.log("Using AMD Video Coding Engine");
  } else if (encoding == "QSV") {
    ffmpegVideoArgs = ["-probesize", "50M", "-hwaccel", "auto", "-f", "gdigrab", "-framerate", fps, "-video_size", screenWidth + "x" + screenHeight, "-offset_x", "0", "-offset_y", "0", "-draw_mouse", "1", "-i", "desktop", "-f", "h264", "-c:v", "h264_qsv", "-preset", "faster", "-profile", "baseline", "-vf", "scale=1280x720", "-pix_fmt", "yuv420p", "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / (fps / 4)) + "M", "tcp://" + ip + ":2222"];
    console.log("Using Intel QSV Encoding");
  } else { //CPU Software Encoding
    ffmpegVideoArgs = ["-probesize", "50M", "-hwaccel", "auto", "-f", "gdigrab", "-framerate", fps, "-video_size", screenWidth + "x" + screenHeight, "-offset_x", "0", "-offset_y", "0", "-draw_mouse", "1", "-i", "desktop", "-f", "h264", "-vf", "scale=1280x720", "-preset", "ultrafast", "-tune", "zerolatency", "-pix_fmt", "yuv420p", "-profile:v", "baseline", "-x264-params", "nal-hrd=cbr", "-b:v", quality + "M", "-minrate", quality - 3 + "M", "-maxrate", quality + "M", "-bufsize", (quality / 2) + "M", "tcp://" + ip + ":2222"];
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
  hidStreamClient.setNoDelay(true);
  console.log('Connected to Switch!');
  if (usingVideo) {
    startVideoProcess();
  }
  if (usingAudio) {
    startAudioProcess();
  }
});
function parseInputStruct(buff) {
  var input = Struct()
    .word32Ule('HeldKeys1')
    .word32Sle('LJoyX1')
    .word32Sle('LJoyY1')
    .word32Sle('RJoyX1')
    .word32Sle('RJoyY1')
    .word32Ule('HeldKeys2')
    .word32Sle('LJoyX2')
    .word32Sle('LJoyY2')
    .word32Sle('RJoyX2')
    .word32Sle('RJoyY2')
    .word32Ule('HeldKeys3')
    .word32Sle('LJoyX3')
    .word32Sle('LJoyY3')
    .word32Sle('RJoyX3')
    .word32Sle('RJoyY3')
    .word32Ule('HeldKeys4')
    .word32Sle('LJoyX4')
    .word32Sle('LJoyY4')
    .word32Sle('RJoyX4')
    .word32Sle('RJoyY4')
    .word32Ule('HeldKeys5')
    .word32Sle('LJoyX5')
    .word32Sle('LJoyY5')
    .word32Sle('RJoyX5')
    .word32Sle('RJoyY5')
    .word32Ule('HeldKeys6')
    .word32Sle('LJoyX6')
    .word32Sle('LJoyY6')
    .word32Sle('RJoyX6')
    .word32Sle('RJoyY6')
    .word32Ule('HeldKeys7')
    .word32Sle('LJoyX7')
    .word32Sle('LJoyY7')
    .word32Sle('RJoyX7')
    .word32Sle('RJoyY7')
    .word32Ule('HeldKeys8')
    .word32Sle('LJoyX8')
    .word32Sle('LJoyY8')
    .word32Sle('RJoyX8')
    .word32Sle('RJoyY8')
    .word32Ule('touchX1')
    .word32Ule('touchY1')
    .word32Ule('touchX2')
    .word32Ule('touchY2')
    .floatle('accelX')
    .floatle('accelY')
    .floatle('accelZ')
    .floatle('gyroX')
    .floatle('gyroY')
    .floatle('gyroZ')
    .word32Ule('controllerCount')
    .word32Ule('frameRate')
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
function convertAnalog(axis) {
  var na;
  if (axis) {
    na = axis / 32767.5
  }
  if (na > 1) {
    na = 2 - na
    na = -na
  }
  return na;
}
function convertAnalogXY(x, y) {
  return { x: convertAnalog(x), y: convertAnalog(y) };

}
function handleControllerInput(hid, controllerId, playerNumber) {
  var heldKeys = hid.get("HeldKeys" + playerNumber);
  var LJoyX = convertAnalog(hid.get("LJoyX" + playerNumber));
  var LJoyY = convertAnalog(hid.get("LJoyY" + playerNumber));
  var RJoyX = convertAnalog(hid.get("RJoyX" + playerNumber));
  var RJoyY = convertAnalog(hid.get("RJoyY" + playerNumber));
  vgen.setAxisL(controllerId, LJoyX, LJoyY);
  vgen.setAxisR(controllerId, RJoyX, RJoyY);
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
var toggledMouseInput = false;
var mouseInput = false;
var touchLeftClicking = false;
var touchRightClicking = false;
function handleMouseInputToggling(hid, playerNumber) {
  var heldKeys = hid.get("HeldKeys" + playerNumber);
  var inputStates = heldKeysBitmask(heldKeys);
  if (inputStates.LS && inputStates.RS) {
    if (!toggledMouseInput) {
      if (mouseInput) {
        mouseInput = false;
      } else {
        mouseInput = true;
      }
      toggledMouseInput = true;
    }
  } else {
    toggledMouseInput = false;
  }
}
function handleAnalogMouse(hid, playerNumber) {
  var RJoyX = convertAnalog(hid.get("RJoyX" + playerNumber));
  var RJoyY = convertAnalog(hid.get("RJoyY" + playerNumber));
  var LJoyX = convertAnalog(hid.get("LJoyX" + playerNumber));
  var LJoyY = convertAnalog(hid.get("LJoyY" + playerNumber));
  var heldKeys = hid.get("HeldKeys" + playerNumber);
  var inputStates = heldKeysBitmask(heldKeys);
  var mouse = robot.getMousePos();
  mx = mouse.x + (RJoyX * 25);
  my = mouse.y - (RJoyY * 25);
  if (mx && my) {
    robot.moveMouse(mx, my);
  }
  if (LJoyX || LJoyY) {
    robot.scrollMouse(LJoyX, LJoyY);
  }
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
}
var gyroHistory = [];
function smoothGyroMouse(gyro) {

  if (gyroHistory.length < 3) {
    gyroHistory.push(gyro);
    return gyro; //smoothing not ready
  } else {
    gyroHistory.shift();
    gyroHistory.push(gyro);
    gyro.x = ((gyroHistory[0].x * 1) + (gyroHistory[1].x * 3) + (gyroHistory[2].x * 5)) / 9;
    gyro.y = ((gyroHistory[0].y * 1) + (gyroHistory[1].y * 3) + (gyroHistory[2].y * 5)) / 9;
    gyro.z = ((gyroHistory[0].z * 1) + (gyroHistory[1].z * 3) + (gyroHistory[2].z * 5)) / 9;
    if (gyro.x < 0.005 && gyro.x > 0) {
      gyro.x = 0;
    } else if (gyro.x > -0.005 && gyro.x < 0) {
      gyro.x = 0;
    }
    if (gyro.y < 0.005 && gyro.y > 0) {
      gyro.y = 0;
    } else if (gyro.y > -0.005 && gyro.y < 0) {
      gyro.y = 0;
    }
    if (gyro.z < 0.005 && gyro.z > 0) {
      gyro.z = 0;
    } else if (gyro.z > -0.005 && gyro.z < 0) {
      gyro.z = 0;
    }
    return gyro;
  }
}
var touchX1Old = 0;
var touchY1Old = 0;
function handleGyroMouse(hid, playerNumber) {
  var RJoyX = convertAnalog(hid.get("RJoyX" + playerNumber));
  var RJoyY = convertAnalog(hid.get("RJoyY" + playerNumber));
  var heldKeys = hid.get("HeldKeys" + playerNumber);
  var inputStates = heldKeysBitmask(heldKeys);
  var gyro = { x: hid.get("gyroX"), y: hid.get("gyroY"), z: hid.get("gyroZ") }
  smoothGyroMouse(gyro);
  var mouse = robot.getMousePos();
  var ngx = gyro.x * -1;
  var ngz = gyro.z * -1
  mx = mouse.x + (ngz * ((screenWidth) / 3));
  my = mouse.y + (ngx * ((screenHeight) / 2));
  if (mx && my) {
    robot.moveMouse(mx, my);
  }
  if (RJoyX || RJoyY) {
    robot.scrollMouse(RJoyX, RJoyY);
  }
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
}
function handleTouchInput(hid) {
  var touchX1 = hid.get("touchX1");
  var touchY1 = hid.get("touchY1");
  if (touchX1 && touchY1) {
    touchX1 -= 15;
    touchY1 -= 15;
    touchX1 = Math.floor(screenWidth * (touchX1 / 1280))
    touchY1 = Math.floor(screenHeight * (touchY1 / 720))
    if (!touchX1old) touchX1old = touchX1;
    if (!touchY1old) touchY1old = touchY1;
    var touchX2 = hid.get("touchX2");
    var touchY2 = hid.get("touchY2");
    if (touchX2 && touchY2) {
      rightTouchTime++;
      if (rightTouchTime > 5) { //Handle scrolling
        var xDiff = touchX1old - touchX1;
        var yDiff = touchY1old - touchY1;
        robot.scrollMouse(xDiff, yDiff);
        scrolling = true;
        touchRightClicking = false;
      } else { //Handle left click
        touchRightClicking = true;
      }
    } else {
      if (touchRightClicking) {
        robot.mouseClick("right");
        touchRightClicking = false
      }
      scrolling = false;
      rightTouchTime = 0;
    }
    if (!scrolling) {
      leftTouchTime++;
      if (Math.abs(touchX1 - touchX1old) > 5 || Math.abs(touchY1 - touchY1old) > 5) {
        robot.moveMouse(touchX1 / screenScale, touchY1 / screenScale);
      }
      if (!touchLeftClicking) {
        robot.mouseToggle("down");
        touchLeftClicking = true;
      }
    } else {
      robot.mouseToggle("up");
      touchLeftClicking = false;
    }
    touchX1old = touchX1;
    touchY1old = touchY1;
  } else {
    if (touchLeftClicking) { //release left click
      robot.mouseToggle("up");
      touchLeftClicking = false;
    }
    leftTouchTime = 0;
    rightTouchTime = 0;
  }
}
function handleGyroAndAccel(hid) {

  var gyro = { x: hid.get("gyroX"), y: hid.get("gyroY"), z: hid.get("gyroZ") }
  var accel = { x: hid.get("accelX"), y: hid.get("accelY"), z: hid.get("accelZ") }
  for (axis in gyro) {
    gyro[axis] *= 250;
  }
  gyro.y *= -1;
  GyroServ.sendMotionData(gyro, accel);
}
var fpsPrintTimer = 0;
var hidDataBuffer = "";
hidStreamClient.on('data', function (chunk) {
  hidDataBuffer += chunk.toString("hex");
  var completeData = "";
  if (hidDataBuffer.includes("ffffffffffffffff") && hidDataBuffer.includes("ffffffffffffff7")) {
    completeData = hidDataBuffer.split("ffffffffffffffff")[1].split("ffffffffffffff7")[0];
    hidDataBuffer = "";
    if (completeData.length != 416) {
      console.log("Incorrect data length: " + completeData.length + " - " + completeData);
      return
    }
  } else {
    return;
  }
  var data = Buffer.from(completeData, 'hex');
  var hid = parseInputStruct(data);

  var controllerCount = hid.get("controllerCount");
  if (controllerCount > controllerIds.length) {
    plugControllerIn();
  }
  fpsPrintTimer++;
  if (fpsPrintTimer == 10) {
    console.log("switchFps=" + hid.get("frameRate"))
    fpsPrintTimer = 0;
  }
  var playerNumber;
  for (i in controllerIds) {
    playerNumber = parseInt(i) + 1;
    handleControllerInput(hid, controllerIds[i], playerNumber);
  }
  handleMouseInputToggling(hid, 1);
  if (mouseControl == "ANALOG" && mouseInput) {
    handleAnalogMouse(hid, 1);
  } else if (mouseControl == "GYRO" && mouseInput) {
    handleGyroMouse(hid, 1);
  }
  handleTouchInput(hid);
  handleGyroAndAccel(hid);
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
      mouseControl = "ANALOG";
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
