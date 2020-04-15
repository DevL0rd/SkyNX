@echo off
cls
Title nxLink
echo Sending compiled homebrew to switch.
C:\devkitPro\tools\bin\nxlink.exe -a 172.16.0.10 SkyNX.nro
pause
exit