@echo off
cd lib
ffmpeg.exe -y -f dshow -i audio=virtual-audio-capturer -af equalizer=f=100:t=h:width=200:g=-64 -f s16le -ar 16000 -ac 2 -c:a pcm_s16le udp://172.16.0.12:2224?pkt_size=640
pause