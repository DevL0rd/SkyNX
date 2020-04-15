#include "renderer.h"

#include <stdbool.h>
#include <switch.h>
#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <unistd.h>
#include "video.h"


static char *clock_strings[] = {
    "333 MHz (underclocked, very slow)", "710 MHz (underclocked, slow)", "1020 MHz (standard, not overclocked)", "1224 MHz (slightly overclocked)", "1581 MHz (overclocked)", "1785 MHz (strong overclock)"};

static int clock_rates[] = {
    333000000, 710000000, 1020000000, 1224000000, 1581000000, 1785000000};

RenderContext *createRenderer()
{
    RenderContext *context = malloc(sizeof(RenderContext));

    context->window = SDL_CreateWindow("sdl2_gles2", 0, 0, RESX, RESY, SDL_WINDOW_FULLSCREEN);
    if (context->window == NULL)
    {
        SDL_Log("SDL_CreateWindow: %s\n", SDL_GetError());
        SDL_Quit();
        while (1);
    }

    context->renderer = SDL_CreateRenderer(context->window, 0, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (context->renderer == NULL)
    {
        SDL_Log("SDL_CreateRenderer: %s\n", SDL_GetError());
        SDL_Quit();
        while (1);
    }

    context->yuv_text = SDL_CreateTexture(context->renderer, SDL_PIXELFORMAT_IYUV, SDL_TEXTUREACCESS_STREAMING, RESX, RESY);

    context->rect.x = 0;
    context->rect.y = 0;
    context->rect.w = RESX;
    context->rect.h = RESY;

    mutexInit(&context->texture_mut);
    mutexInit(&context->frame_avail_mut);
    mutexInit(&context->video_active_mut);
    context->frame_avail = false;
    context->video_active = false;

    PlFontData fontData, fontExtData;
    plGetSharedFontByType(&fontData, PlSharedFontType_Standard);
    plGetSharedFontByType(&fontExtData, PlSharedFontType_NintendoExt);
    context->font = FC_CreateFont();
    FC_LoadFont_RW(context->font, context->renderer, SDL_RWFromMem((void *)fontData.address, fontData.size), SDL_RWFromMem((void *)fontExtData.address, fontExtData.size), 1, 40, FC_MakeColor(0, 0, 0, 255), TTF_STYLE_NORMAL);

    context->overclock_status = 2;

    return context;
}

void applyOC(RenderContext *context)
{
    pcvSetClockRate(PcvModule_CpuBus, clock_rates[context->overclock_status]);
}

void setFrameAvail(RenderContext *context)
{
    mutexLock(&context->frame_avail_mut);
    context->frame_avail = true;
    mutexUnlock(&context->frame_avail_mut);
}

bool checkFrameAvail(RenderContext *context)
{
    bool ret;
    mutexLock(&context->frame_avail_mut);
    ret = context->frame_avail;
    context->frame_avail = false;
    mutexUnlock(&context->frame_avail_mut);
    return ret;
}

bool isVideoActive(RenderContext *context)
{
    bool ret;
    mutexLock(&context->video_active_mut);
    ret = context->video_active;
    mutexUnlock(&context->video_active_mut);
    return ret;
}

void setVideoActive(RenderContext *context, bool active)
{
    mutexLock(&context->video_active_mut);
    context->video_active = active;
    mutexUnlock(&context->video_active_mut);
}

void SDL_ClearScreen(RenderContext *context, SDL_Color colour)
{
    SDL_SetRenderDrawColor(context->renderer, colour.r, colour.g, colour.b, colour.a);
    SDL_RenderClear(context->renderer);
}

void SDL_DrawText(RenderContext *context, int x, int y, SDL_Color colour, const char *text)
{
    FC_DrawColor(context->font, context->renderer, x, y, colour, text);
}

void drawSplash(RenderContext *context)
{
    u32 ip = gethostid();
    char str_buf[300];
    snprintf(str_buf, 300, "Your Switch is now ready for a PC to connect!\nIt has the IP-Address %u.%u.%u.%u\n"
                           "\nInstructions can be found here:"
                           "\nhttps://github.com/jakibaki/In-Home-Switching/blob/master/README.md"
                           "\n\nOverclock status:\n%s"
                           "\nPress X to increase, Y to decrease clockrate",
             ip & 0xFF, (ip >> 8) & 0xFF, (ip >> 16) & 0xFF, (ip >> 24) & 0xFF,
             clock_strings[context->overclock_status]);

    SDL_Color black = {0, 0, 0, 255};
    SDL_Color white = {230, 230, 230, 255};
    SDL_ClearScreen(context, white);

    SDL_DrawText(context, 170, 150, black, str_buf);

    SDL_RenderPresent(context->renderer);

    hidScanInput();
    u32 keys = hidKeysDown(CONTROLLER_P1_AUTO);
    if (keys & KEY_X)
    {
        if (context->overclock_status < sizeof(clock_rates) / sizeof(int) - 1)
        {
            context->overclock_status++;
            applyOC(context);
        }
    }

    if (keys & KEY_Y)
    {
        if (context->overclock_status > 0)
        {
            context->overclock_status--;
            applyOC(context);
        }
    }
}

u64 old_time = 0, new_time = 0;
void handleFrame(RenderContext *renderContext, VideoContext *videoContext)
{
    AVFrame *frame = videoContext->frame;

    mutexLock(&renderContext->texture_mut);
    memcpy(renderContext->YPlane, frame->data[0], sizeof(renderContext->YPlane));
    memcpy(renderContext->UPlane, frame->data[1], sizeof(renderContext->UPlane));
    memcpy(renderContext->VPlane, frame->data[2], sizeof(renderContext->VPlane));
    mutexUnlock(&renderContext->texture_mut);
    setFrameAvail(renderContext);

    if (++videoContext->video_frame_count % 60 == 0)
    {
        new_time = svcGetSystemTick();
        printf("Framerate: %f\n", 60.0 / ((new_time - old_time) / 19200000.0));
        old_time = new_time;
    }
}

void displayFrame(RenderContext *renderContext)
{
    while (!checkFrameAvail(renderContext))
    {
    }

    SDL_RenderClear(renderContext->renderer);

    mutexLock(&renderContext->texture_mut);
    SDL_UpdateYUVTexture(renderContext->yuv_text, &renderContext->rect, renderContext->YPlane, RESX,
                         renderContext->UPlane, RESX / 2,
                         renderContext->VPlane, RESX / 2);
    mutexUnlock(&renderContext->texture_mut);

    SDL_RenderCopy(renderContext->renderer, renderContext->yuv_text, NULL, NULL);
    SDL_RenderPresent(renderContext->renderer);
}

void freeRenderer(RenderContext *context)
{
    free(context);
}