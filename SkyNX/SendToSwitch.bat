@echo off
:1
cls
Title nxLink
echo Sending compiled homebrew to switch.
C:\devkitPro\tools\bin\nxlink.exe -a 172.16.0.12 -s SkyNX.nro
pause
goto 1