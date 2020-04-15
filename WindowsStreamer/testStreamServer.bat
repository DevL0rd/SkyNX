@echo off
:1
cls
ffmpeg -y -f rawvideo -pixel_format rgb32 -framerate 300 -video_size 1280x720 -i pipe: -f h264 -vf scale=1280x720 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -profile:v baseline -x264-params nal-hrd=cbr -b:v 5M -minrate 5M -maxrate 5M -bufsize 2M tcp://172.16.0.10:2222 
pause
goto 1