#include "renderer.h"

#include <stdbool.h>
#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <unistd.h>
#include "video.h"
#include <time.h>

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
        while (1)
            ;
    }

    context->renderer = SDL_CreateRenderer(context->window, 0, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (context->renderer == NULL)
    {
        SDL_Log("SDL_CreateRenderer: %s\n", SDL_GetError());
        SDL_Quit();
        while (1)
            ;
    }
    SDL_SetRenderDrawBlendMode(context->renderer, SDL_BLENDMODE_BLEND); //enable transparency
    //Create font cache
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
void draw_rect(RenderContext *context, int x, int y, int w, int h, SDL_Color colour)
{
    SDL_SetRenderDrawColor(context->renderer, colour.r, colour.g, colour.b, colour.a);
    SDL_Rect r = {x, y, w, h};
    SDL_RenderFillRect(context->renderer, &r);
}
void strokeCircle(RenderContext *context, int32_t centreX, int32_t centreY, int32_t radius, SDL_Color colour)
{
    const int32_t diameter = (radius * 2);
    int32_t x = (radius - 1);
    int32_t y = 0;
    int32_t tx = 1;
    int32_t ty = 1;
    int32_t error = (tx - diameter);
    SDL_SetRenderDrawColor(context->renderer, colour.r, colour.g, colour.b, colour.a);
    while (x >= y)
    {
        //  Each of the following renders an octant of the circle
        SDL_RenderDrawPoint(context->renderer, centreX + x, centreY - y);
        SDL_RenderDrawPoint(context->renderer, centreX + x, centreY + y);
        SDL_RenderDrawPoint(context->renderer, centreX - x, centreY - y);
        SDL_RenderDrawPoint(context->renderer, centreX - x, centreY + y);
        SDL_RenderDrawPoint(context->renderer, centreX + y, centreY - x);
        SDL_RenderDrawPoint(context->renderer, centreX + y, centreY + x);
        SDL_RenderDrawPoint(context->renderer, centreX - y, centreY - x);
        SDL_RenderDrawPoint(context->renderer, centreX - y, centreY + x);

        if (error <= 0)
        {
            ++y;
            error += ty;
            ty += 2;
        }

        if (error > 0)
        {
            --x;
            tx += 2;
            error += (tx - diameter);
        }
    }
}
void drawCircle(RenderContext *context, int32_t centreX, int32_t centreY, int32_t radius, int lineThicknes, SDL_Color colour)
{
    for (int i = 0; i < lineThicknes; i++)
    {
        strokeCircle(context, centreX, centreY, radius - i, colour);
    }
}
void drawGradient(RenderContext *context, int x, int y, int w, int h, SDL_Color colourStart, SDL_Color colourEnd, int direction)
{
    int drawLines = 1;
    switch (direction)
    {
    case 1: //Top to bottom gradient
        drawLines = h;
        break;
    case 2: //Bottom to top gradient
        drawLines = h;
        break;
    case 3: //Left to right gradient
        drawLines = w;
        break;
    case 4: //Right to left gradient
        drawLines = w;
        break;
    }
    for (int i = 0; i < drawLines; i++)
    { //Top to bottom gradient
        float t = ((float)(i)) / ((float)(drawLines));
        int r = ((float)colourStart.r) * (1.0f - t) + ((float)colourEnd.r) * t;
        int g = ((float)colourStart.g) * (1.0f - t) + ((float)colourEnd.g) * t;
        int b = ((float)colourStart.b) * (1.0f - t) + ((float)colourEnd.b) * t;
        int a = ((float)colourStart.a) * (1.0f - t) + ((float)colourEnd.a) * t;
        SDL_Color glc = {r, g, b, a};
        switch (direction)
        {
        case 1:
            draw_rect(context, x, y + i, w, 1, glc);
            break;
        case 2:
            draw_rect(context, x, (y + h) - i, w, 1, glc);
            break;
        case 3:
            draw_rect(context, x + 1, y, 0, h, glc);
            break;
        case 4:
            draw_rect(context, (x + w) - i, y, 0, h, glc);
            break;
        }
    }
}
int getRandomInt(int minimum_number, int max_number)
{
    return rand() % (max_number + 1 - minimum_number) + minimum_number;
}
time_t deltaThen = 0;
time_t deltaNow = 1;
u32 delta = 1;

void loopStart()
{
    deltaNow = time(NULL);
    // printf("%d ", deltaNow);
    delta = (deltaNow - deltaThen) / 1000;
}

void loopEnd()
{
    deltaThen = deltaNow;
}
typedef struct
{
    int x;
    int y;
    int r;
    int vx;
    int vy;
    SDL_Color color;
} bubble;
int bubblesLength = 0;
bubble bubbles[20];
bubble getNewBubble()
{
    SDL_Color bubbleColor = {getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255), 255};
    int randXv = 0;
    if (getRandomInt(0, 1) == 0)
    {
        randXv = getRandomInt(0, 2);
    }
    else
    {
        randXv = getRandomInt(0, 2) * -1;
    }
    bubble newBubble = {getRandomInt(0, 1280), 750, getRandomInt(5, 25), randXv, getRandomInt(1, 3) * -1, bubbleColor};
    return newBubble;
}
void doBubbles(RenderContext *context)
{
    if (bubblesLength < 20)
    {
        bubblesLength++;
        bubbles[bubblesLength] = getNewBubble();
    }

    for (int i = 0; i < bubblesLength; i++)
    {
        bubbles[i].x += (unsigned int)bubbles[i].vx;
        bubbles[i].y += (unsigned int)bubbles[i].vy;
        //Use when delta is working and i figure out time
        // bubbles[i].x += (unsigned int)bubbles[i].vx * delta;
        // bubbles[i].y += (unsigned int)bubbles[i].vy * delta;
        int negRadius = (unsigned int)bubbles[i].r * -1;
        if (bubbles[i].y < negRadius)
        {
            bubbles[i] = getNewBubble();
        }
        drawCircle(context, bubbles[i].x, bubbles[i].y, bubbles[i].r, 1, bubbles[i].color);
    }
}
void drawSplash(RenderContext *context)
{
    loopStart();
    SDL_Color bg = {50, 50, 50, 255};
    SDL_ClearScreen(context, bg);
    SDL_Color gf = {0, 0, 0, 255};
    SDL_Color gt = {0, 0, 0, 0};
    doBubbles(context);
    drawGradient(context, 0, 0, 1280, 100, gf, gt, 1);
    drawGradient(context, 0, 720 - 100, 1280, 100, gf, gt, 2);

    SDL_Color white = {230, 230, 230, 255};
    u32 ip = gethostid();
    char str_buf[300];
    snprintf(str_buf, 300, "IP-Address: %u.%u.%u.%u\n",
             ip & 0xFF, (ip >> 8) & 0xFF, (ip >> 16) & 0xFF, (ip >> 24) & 0xFF);

    SDL_DrawText(context, 400, 630, white, str_buf);

    SDL_RenderPresent(context->renderer);

    // hidScanInput();
    // u32 keys = hidKeysDown(CONTROLLER_P1_AUTO);
    // if (keys & KEY_X)
    // {
    //     if (context->overclock_status < sizeof(clock_rates) / sizeof(int) - 1)
    //     {
    //         context->overclock_status++;
    //         applyOC(context);
    //     }
    // }

    // if (keys & KEY_Y)
    // {
    //     if (context->overclock_status > 0)
    //     {
    //         context->overclock_status--;
    //         applyOC(context);
    //     }
    // }
    loopEnd();
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