@echo off
:1
cls
Title nxLink
echo Sending compiled homebrew to switch.
C:\devkitPro\tools\bin\nxlink.exe -a 192.168.1.111 -s SkyNX.nro
pause
goto 1