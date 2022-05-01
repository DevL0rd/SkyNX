# SkyNX+

This is a modfied version of SkyNX which fixes the AMD encoder issues currently present on the main branch. Also includes more user input for vsync options and allows you to specify a monitor when setting the resolution to 720p (This issue appears in multi-monitor setups). SkyNX allows you to stream your PC games to your Nintendo Switch without Android! Now on the Homebrew App Store!

Let me know if there's any issues with NVIDIA / Intel encoders as I can only test with AMD / CPU.

[NEW Downloads are here](https://github.com/williamhackett0/SkyNX/releases).
[Old Downloads are here](https://github.com/DevL0rd/SkyNX/releases).

The desktop streaming client is completely new. The Switch app however has it's roots in the original [In-Home-Switching](https://github.com/jakibaki/In-Home-Switching) app.
## Features
 * Stream PC games with audio to switch at 60fps!
 * Handles up to 8 JoyCon pairs. (8 Players at once!)
 * Motion control support for Cemu.
 * Use Analog sticks and triggers to control mouse
 * Use gyro to control mouse like a Wii remote.
 * Built in Nvidia encoding for low latency.
 * Built in AMD encoding for low latency. 
 * Built in Intel encoding for low latency.
 * Automatically sets desktop resolution for max performance. (Optional)
 * Optionally disable video  to use the JoyCons as remotes on PC!
 * Optionally disable audio.
 * Optionally swap A and B AND X and Y.
 * Handles basic touch input.
 * Handles right click. (Touch with 1 finger, tap with the second)
 * Handles scrolling. (Your standard 2 finger scroll.)

## Instructions:
NOTE if you have a issue installing the audio driver, make sure you have the latest [VCRedist](https://www.microsoft.com/en-us/download/confirmation.aspx?id=5555)
1. Copy the switch folder in SkyNX.zip, to the root of your sd card.
2. Install the forwarder with a nsp installer such as Goldleaf.
3. Extract SkyNXStreamer-win32-ia32.zip to somewhere safe.
4. Open SkyNXStreamer-win32-ia32/SkyNXStreamer.exe
5. Launch SkyNX on switch.
6. Put the IP showed on the app into the streamer.
7. Click start streamer.

## SkyNX App
![SkyNX App](Screenshots/App.jpg "SkyNX App")

## SkyNX Streamer
![SkyNX Streamer](Screenshots/Main.png "SkyNX Streamer")![SkyNX Settings](Screenshots/Settings.png "SkyNX Settings")
![SkyNX Stats](Screenshots/Stats.png "SkyNX Stats")![SkyNX Console](Screenshots/Console.png "SkyNX Console")

## Troubleshooting:
If for some reason the controllers don't work. Try the following steps.
1. Restart windows, and launch it again.
2. If it still is not working. And you have previously used In-Home-Switching, Try removing the ScpDriverInterface that In-Home-Switching installs. You can use the installer that came with it to uninstall it, or get it [Here](https://github.com/mogzol/ScpDriverInterface/releases/download/1.1/ScpDriverInterface_v1.1.zip).

If the streamer just starts and stops immediately, try the following steps.
1. Reinstall the xBox controller driver from the settings tab.
2. Try running it again, if it still fails, restart the system and try once more.

If there is no audio playing..
1. Remove the audio driver in settings, and re-install it. If it doesn't work then try step 2.
2. Restart windows and launch it again.

## Known issues
* Currently more than 1 controller is not working, please wait for update.

## Credits to
* [DuchessOfDark88](https://twitter.com/DuchessOfDark88) App icon and graphics. (Some content at this link may be NSFW)
* [ffmpeg](https://www.ffmpeg.org/) for being such a powerful media tool that we use on PC and Switch.
* [SwitchBrew](https://switchbrew.org/) for libNX and its ffmpeg inclusion
* [Atmosphère](https://github.com/Atmosphere-NX/Atmosphere) for being such a great Switch CFW
* [Screen Capture Recorder](https://github.com/rdp/screen-capture-recorder-to-video-windows-free) for helping us grab audio.
* [William Hackett](https://github.com/williamhackett0/SkyNX) Fixing AMD encoding bug + adding some general fixes/improvements.
