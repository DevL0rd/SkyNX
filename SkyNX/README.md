# In-Home-Switching

This is a homebrew that enables streaming of PC games to the Nintendo Switch.

Have you ever been told by your parents that spending hours sitting in front of a PC was bad for you (like I was)? Well, now you can play your games portably anywhere in your house!

This project is fairly new, so please do not consider it totally stable. If you encounter issues, feel free to submit them.

## Features:
  * Stream PC screen to a Nintendo Switch in your local network
    * 720p (full Switch-Tablet display resolution)
    * 40-60 FPS (if not see Troubleshooting)
    * Low delay (again, see Troubleshooting)
    * Audio support (experimental)
  * Capture controller input on Nintendo Switch
    * Emulate an Xbox controller on the PC
  * PC app offers picture quality adjustments

## How to Use
If you do not want to build by yourself, have a look at the [releases page](https://github.com/jakibaki/In-Home-Switching/releases). There you can find an Archive with the App for the Switch as well as the corresponding PC companion app. For the PC App, just execute In-Home-Switching.exe in the Windows directory after unzipping. 

On PC, [Scp drivers](https://github.com/mogzol/ScpDriverInterface/releases/download/1.1/ScpDriverInterface_v1.1.zip) must also be installed (just unzip and execute `Driver Installer/ScpDriverInstaller.exe`). Otherwise the program will crash silently. For audio, [Screen Capture Recorder](https://github.com/rdp/screen-capture-recorder-to-video-windows-free/releases) also needs to be installed.

*Also please set your PC resolution to 1280x720p in Windows for getting **much** better performance of screen capturing while running the app.*

On the Switch, find out its IP address and start the app with your Switch CFW. Then type in the Switch's IP address on the PC app and hit the `Connect` button.

## Windows App Screenshot

![PC companion app](screenshots/windowsappuiupdate.png "PC app for streaming screen")

## Screenshots from Nintendo Switch

![Track Mania](screenshots/TrackMania.jpg "Track Mania on Switch")
![Witcher 3](screenshots/witcher.jpg "Witcher 3 on Switch")
![PC companion app](screenshots/PCApp.jpg "PC app for streaming screen")


## Current Limitations
  * Only works with Windows 8 (64-bit) and newer
  * Audio support only experimental atm
  * No support for Switch CFW other than [Atmosphère](https://github.com/Atmosphere-NX/Atmosphere) or [Kosmos](https://github.com/AtlasNX/Kosmos)

## Known issues
  * So far Switch crashes when put to sleep with app running (please close app beforehand, we have not fixed this issue yet)
  * App breaks when Switch changes from docked to handheld mode or vice-versa. Please quit the app before doing so.

## Further notices
This app uses core overclocking to 1785 MHz on the Nintendo Switch. We use this measure in order to decode the incoming videos efficiently. As far as we know, there have been no reported cases of this damaging any devices. In other words, it is considered safe. Still we do not warrant for any potential device damage caused by this homebrew.


## Scheduled for Future Releases
  * Stream PC audio to Switch
  * MacOS and Linux Support
  * Multi-controller support
  * Mouse emulation
  * More efficient threading
  * GPU encoding on PC

## Build instructions

Use the PKGBUILD from [here](https://github.com/jakibaki/pacman-packages/tree/ffmpeg_networking/switch/ffmpeg) for ffmpeg on Switch with more protocols enabled.

Everything else will follow here in short time (ask jakibaki on AtlasNX discord if necessary).

## Troubleshooting

### *Nice videos, but sadly that delay makes it unplayable*

If you are experiencing delays greater than 0.1 seconds, either your PC is just too slow for your chosen quality options (try worsening image quality) or your local network is bad. Basically we need instant data transfer in your network to work properly (this has nothing to do with throughput, just latency).  
Some WiFi-routers unfortunately just aren't up to the task.

### *These framedrops hurt my eyes!*

Your PC is probably too slow for encoding with the games/applications on. Try other applications, lower image quality and, if you haven't already, set your PC screen resolution to 1280x720p (saves scaling).

### *No drops, but my framerate is just very low*

Well, in our tests we had 60 FPS on Windows 10 with low image quality... I guess you can try the same strategies as for fixing framedrops, I hope that helps.

## Nightlies

We now feature nightly builds of the Switch app (always based on current master branch). They can be found [here](https://bsnx.lavatech.top/in-home-switching/).
These builds are considered experimental, so please do not panic if something crashes sometimes ;)

## License

This code is licensed GPLv3 and this has a reason: We do not want to see (or read about) any parts of this project in non-open-source software (everything that is not GPLv3 licensed). Please share the notion of free code for everyone.

## Credits to

* [ffmpeg](https://www.ffmpeg.org/) for being such a powerful media tool that we use on PC and Switch.
* [SwitchBrew](https://switchbrew.org/) for libNX and its ffmpeg inclusion
* [Atmosphère](https://github.com/Atmosphere-NX/Atmosphere) for being such a great Switch CFW
* [Captura](https://github.com/MathewSachin/Captura) for showing us how to capture frame input with Windows Duplication API
* [simontime](https://github.com/switch-stuff/switch-usb-screen-stream-sharp) for his switch-usb-screen-stream-sharp project for Windows
* [ScpDriverInterface](https://github.com/mogzol/ScpDriverInterface/) for the Xbox drivers on Windows
* [Guillem96](https://github.com/Guillem96) for greatly improving our code quality
* [NX-Shell](https://github.com/joel16/NX-Shell) for teaching us how to use SDL
* [Checkpoint](https://github.com/FlagBrew/Checkpoint) also for SDL examples
* [SunTheCourier](https://github.com/SunTheCourier) for adding config support to our Windows client
* [AveSatanas](https://gitlab.com/ao) for offering a server that automatically builds our nightlies
* [Screen Capture Recorder](https://github.com/rdp/screen-capture-recorder-to-video-windows-free) for helping us grabbing audio
