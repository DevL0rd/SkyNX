@echo off
cls
call electron-packager . SkyNXStreamer --platform=win32 --arch=ia32 --icon=./icon.ico
pause