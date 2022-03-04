#include <libavutil/samplefmt.h>

#include <switch.h>
#include <SDL.h>

#include "context.h"
#include "input.h"
#include "video.h"
#include "network.h"
#include "renderer.h"
#include "audio.h"
static const SocketInitConfig socketInitConf = {
    .bsdsockets_version = 1,

    .tcp_tx_buf_size = 0x80000,
    .tcp_rx_buf_size = 0x100000,
    .tcp_tx_buf_max_size = 0x400000,
    .tcp_rx_buf_max_size = 0x400000,

    .udp_tx_buf_size = 0x1400,
    .udp_rx_buf_size = 0x3500,

    .sb_efficiency = 2,
};

static Thread renderThread;
static Thread inputHandlerThread;
static Thread audioHandlerThread;
void startInput()
{
    input_init();
    threadCreate(&inputHandlerThread, inputHandlerLoop, NULL, NULL, 0x1000, 0x2b, 0);
    threadStart(&inputHandlerThread);
}

void startAudio()
{
    // On same thread as input and preemptive
    threadCreate(&audioHandlerThread, audioHandlerLoop, NULL, NULL, 0x10000, 0x20, 1);
    threadStart(&audioHandlerThread);
}

void startRender(VideoContext *videoContext)
{
    threadCreate(&renderThread, videoLoop, videoContext, NULL, 0x800000, 0x2b, 2);
    threadStart(&renderThread);
}

RenderContext *renderContext = NULL;
VideoContext *videoContext = NULL;
ClkrstSession cpuSession;
void init()
{
    // consoleInit(NULL);
    /* Init all switch required systems */
    printf("romfsInit\n");
    romfsInit();

    printf("networkInit\n");
    network_init(&socketInitConf);

    printf("audoutInitialize\n");
    audoutInitialize();

    printf("audoutStartAudioOut\n");
    audoutStartAudioOut();

    printf("clkrstInitialize\n");
    clkrstInitialize();
    clkrstOpenSession(&cpuSession, PcvModuleId_CpuBus, 3);
    clkrstSetClockRate(&cpuSession, 1785000000);

    printf("startAudio\n");
    startAudio();

    printf("startInput\n");
    startInput();

    printf("makeRenderer\n");
    renderContext = makeRenderer();
    printf("createVideoContext\n");
    videoContext = createVideoContext();
    videoContext->renderContext = renderContext;
    printf("startRender\n");
    startRender(videoContext);
    printf("appletSetIdleTimeDetectionExtension\n");
    appletSetIdleTimeDetectionExtension(AppletIdleTimeDetectionExtension_None);
    printf("Complete INIT!\n");
}

void unInit()
{
    freeRenderer(renderContext);
    freeVideoContext(videoContext);
    clkrstCloseSession(&cpuSession); // end OC
    clkrstExit();
    input_unInit();
    audoutStopAudioOut();
    audoutExit();
    network_unInit();
    plExit();
}
bool threadsSleeping = false;
int main(int argc, char **argv)
{
    init();
    while (appletMainLoop())
    {
        if (appletGetFocusState() == AppletFocusState_InFocus)
        {
            if (threadsSleeping)
            {
                threadResume(&renderThread);
                threadResume(&inputHandlerThread);
                threadResume(&audioHandlerThread);
                threadsSleeping = false;
            }
            if (isVideoActive(renderContext))
            {
                displayFrame(renderContext);
            }
            else
            {
                drawSplash(renderContext);
            }
            svcSleepThread(14285714ULL); // Nano sleep to keep at 70fps to handle drop frames without stutter
        }
        else
        {
            printf("sleeping\n");
            if (!threadsSleeping)
            {
                threadPause(&renderThread);
                threadPause(&inputHandlerThread);
                threadPause(&audioHandlerThread);
                threadsSleeping = true;
            }
            svcSleepThread(1000000000ULL);
        }
    }
    /* Deinitialize all used systems */
    unInit();
    return 0;
}
