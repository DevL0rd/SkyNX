#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <malloc.h>
#include <inttypes.h>
#include <switch.h>

#include <netdb.h>
#include <netinet/in.h>

#include <sys/types.h>
#include <sys/socket.h>

#include <arpa/inet.h>
#include <unistd.h>

#define SAMPLERATE 48000
#define CHANNELCOUNT 2
#define FRAMERATE (1000 / 30)
#define SAMPLECOUNT (SAMPLERATE / FRAMERATE)
#define BYTESPERSAMPLE 2

void diep(char *s)
{
    perror(s);
    while (1)
        ;
}

int setup_socket()
{
    struct sockaddr_in si_me;
    int s;

    if ((s = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == -1)
        diep("socket");

    memset((char *)&si_me, 0, sizeof(si_me));
    si_me.sin_family = AF_INET;
    si_me.sin_port = htons(2224);
    si_me.sin_addr.s_addr = htonl(INADDR_ANY);
    if (bind(s, &si_me, sizeof(si_me)) == -1)
        diep("bind");
    return s;
}

#define BUF_COUNT 5
AudioOutBuffer audiobuf[BUF_COUNT];
u8 *buf_data[BUF_COUNT];
int curBuf = 0;
#define swapbuf (curBuf = (curBuf + 1) % (BUF_COUNT))

AudioOutBuffer *audout_released_buf;
int audout_filled = 0;
void play_buf(int buffer_size, int data_size)
{

    if (audout_filled >= BUF_COUNT)
    {
        u32 released_count;
        //audoutPlayBuffer(&audout_released_buf, &released_count);
        audoutWaitPlayFinish(&audout_released_buf, &released_count, UINT64_MAX);
    }

    audiobuf[curBuf].next = 0;
    audiobuf[curBuf].buffer = buf_data[curBuf];
    audiobuf[curBuf].buffer_size = buffer_size;
    audiobuf[curBuf].data_size = data_size;
    audiobuf[curBuf].data_offset = 0;
    audoutAppendAudioOutBuffer(&audiobuf[curBuf]);

    audout_filled++;

    swapbuf;
}

// out_buf has to be in_buf_size*fact*2 big
short lastAbove0Value = 0;
void resample(unsigned short *in_buf, int in_buf_size, unsigned short *out_buf, short fact)
{
    int channels = 2;
    //channels are right next to each other
    int dataLength = in_buf_size / sizeof(unsigned short);
    for (int i = 0; i < dataLength; i += channels) //skip through audio data based on channel count
    {
        int out_base = i * fact; //get next starting point in upsampled audio buffer

        for (int j = 0; j < fact; j++) //do this thing 3 times to fill missing audio
        {
            for (int chan = 0; chan < channels; chan++) //For both channels
            {
                out_buf[out_base++] = in_buf[i + chan]; //Smoothing here?? maybe..
            }
        }
    }
}

#define DATA_SIZE 1920
#define IN_RATE 160000  // Bitrate.
#define OUT_RATE 480000 // Bitrate.
#define FACT (OUT_RATE / IN_RATE)
#define IN_BUFSIZE (DATA_SIZE / FACT)

void audioHandlerLoop()
{
    char in_buf[IN_BUFSIZE] = {0};

    u32 buffer_size = (DATA_SIZE + 0xfff) & ~0xfff;

    for (int curBuf = 0; curBuf < BUF_COUNT; curBuf++)
    {
        buf_data[curBuf] = memalign(0x1000, buffer_size);
    }

    int sock = setup_socket();
    printf("%d\n", sock);
    int played = 0;
    struct sockaddr si_other;
    socklen_t slen = sizeof(si_other);
    while (appletMainLoop())
    {
        int ret = recvfrom(sock, in_buf, sizeof(in_buf), 0, &si_other, &slen);
        if (ret < 0)
        {
            perror("recv failed:");
            continue;
        }
        if (ret != sizeof(in_buf))
        {
            printf("Bad input %d\n", ret);

            continue;
        }
        resample((unsigned short *)in_buf, sizeof(in_buf), (unsigned short *)buf_data[curBuf], FACT);
        play_buf(buffer_size, DATA_SIZE);
        played++;
    }

    for (int curBuf = 0; curBuf < BUF_COUNT; curBuf++)
    {
        free(buf_data[curBuf]);
    }
}
