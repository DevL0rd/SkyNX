#include "renderer.h"

#include <stdbool.h>
#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <unistd.h>
#include "video.h"
#include <time.h>
float timeThen = 0;
float timeNow = 1;
float delta = 1;
void initDelta()
{
    timeThen = svcGetSystemTick();
    timeNow = svcGetSystemTick();
    delta = (timeNow - timeThen) / 10000000;
}
void loopStart()
{
    timeNow = svcGetSystemTick();
    delta = (timeNow - timeThen) / 10000000;
    if (delta > 1)
    {
        // to much lag. set to 1
        delta = 1.0f;
    }
}

void loopEnd()
{
    timeThen = timeNow;
}

int getRandomInt(int minimum_number, int max_number)
{
    return rand() % (max_number + 1 - minimum_number) + minimum_number;
}
typedef struct
{
    float x;
    float y;
    float r;
    float vx;
    float vy;
    SDL_Color color;
} bubble;
typedef struct
{
    bubble a;
    bubble aIndex;
    bubble b;
    bubble bIndex;
} bubblePair;
typedef struct
{
    float vx;
    float vy;
} vector;
vector globalForce = {0, -30};

int bubblesLength = 0;
int maxBubbles = 20;
bubble bubbles[20];
long getDistance(long ax, long ay, long bx, long by)
{
    long a = ax - bx;
    long b = ay - by;
    return sqrt(a * a + b * b);
}
bubble resolveBubble(bubble b1, bubble b2)
{ // Fix colliding circles
    long distance_x = b1.x - b2.x;
    long distance_y = b1.y - b2.y;
    long radii_sum = b1.r + b2.r;
    long distance = getDistance(b1.x, b1.y, b2.x, b2.y);
    long unit_x = distance_x / distance;
    long unit_y = distance_y / distance;

    b1.x = b2.x + (radii_sum)*unit_x; // Uncollide
    b1.y = b2.y + (radii_sum)*unit_y; // Uncollide
    // Conservation of momentum
    long newVelX1 = (b1.vx * (b1.r - b2.r) + (2 * b2.r * b2.vx)) / radii_sum;
    long newVelY1 = (b1.vy * (b1.r - b2.r) + (2 * b2.r * b2.vy)) / radii_sum;
    // long newVelX2 = (b2.vx * (b2.r - b1.r) + (2 * b1.r * b1.vx)) / radii_sum;
    // long newVelY2 = (b2.vy * (b2.r - b1.r) + (2 * b1.r * b1.vy)) / radii_sum;
    b1.vx = newVelX1;
    b1.vy = newVelY1;
    // b2.vx = newVelX2;
    // b2.vy = newVelY2;
    bubble newBubble = b1;
    return newBubble;
}
bool detectCircleToCircleCollision(bubble b1, bubble b2)
{ // check for collision between circles
    long radii_sum = b1.r + b2.r;
    long distance = getDistance(b1.x, b1.y, b2.x, b2.y); // If distance is less than radius added together a collision is occuring
    if (distance < radii_sum)
    {
        return true;
    }
    return false;
}
bool testForCollision(bubble b, int bI)
{
    for (int i = 0; i < bubblesLength; i++)
    {
        if (i != bI)
        {
            if (detectCircleToCircleCollision(b, bubbles[i]))
            {
                return true;
            }
        }
    }
    return false;
}
void resolveCollisions()
{
    bubble newBubbles[20];
    bool aCollided = false;
    for (int a = 0; a < bubblesLength; a++)
    {
        for (int b = a + 1; b < bubblesLength; b++)
        {

            if (detectCircleToCircleCollision(bubbles[a], bubbles[b]))
            {
                aCollided = true;
                newBubbles[a] = resolveBubble(bubbles[a], bubbles[b]);
            }
        }
        if (!aCollided)
        { // If nothing collided keep the same data
            newBubbles[a] = bubbles[a];
        }
        aCollided = false;
    }
    for (int i = 0; i < bubblesLength; i++)
    {
        bubbles[i] = newBubbles[i];
    }
}
void initBubbles()
{
    while (bubblesLength < maxBubbles)
    {
        SDL_Color bubbleColor = {148, 0, 126, 255};
        float randR = 15;
        if (bubblesLength < 8)
        {
            SDL_Color nbc = {120, 0, 102, 120};
            randR = getRandomInt(5, 20);
            bubbleColor = nbc;
        }
        else if (bubblesLength < 13)
        {
            SDL_Color nbc = {89, 0, 76, 180};
            randR = getRandomInt(25, 40);
            bubbleColor = nbc;
        }
        else if (bubblesLength < 17)
        {
            SDL_Color nbc = {66, 0, 57, 200};
            randR = getRandomInt(45, 60);
            bubbleColor = nbc;
        }
        else if (bubblesLength < 20)
        {
            SDL_Color nbc = {46, 0, 40, 230};
            randR = getRandomInt(65, 80);
            bubbleColor = nbc;
        }
        float randXv = 0;
        if (getRandomInt(0, 1) == 0)
        {
            randXv = getRandomInt(10, 25);
        }
        else
        {
            randXv = getRandomInt(10, 25) * -1;
        }
        float randYv = getRandomInt(20, 50) * -1;
        bool collides = true;
        while (collides)
        {
            int randX = getRandomInt(0, 1280);
            int randY = getRandomInt(0, 720);
            bubble nb = {randX, randY, randR, randXv, randYv, bubbleColor};
            if (!testForCollision(nb, -1)) //-1 is because bubble has not yet spawned
            {
                bubblesLength++;
                bubbles[bubblesLength] = nb;
                collides = false;
            }
        };
    }
}
SDL_Texture *logoTexture = NULL;
RenderContext *makeRenderer()
{
    SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER);
    SDL_Log("TTF_Init");
    TTF_Init();
    SDL_Log("plInitialize");
    plInitialize(PlServiceType_User);
    SDL_Log("malloc RenderContext\n");
    RenderContext *context = malloc(sizeof(RenderContext));
    SDL_Log("SDL_CreateWindow\n");
    context->window = SDL_CreateWindow("sdl2_gles2", 0, 0, RESX, RESY, SDL_WINDOW_FULLSCREEN);
    if (context->window == NULL)
    {
        SDL_Log("SDL_CreateWindow: %s\n", SDL_GetError());
        SDL_Quit();
        while (1)
            ;
    }

    SDL_Log("SDL_CreateRenderer\n");
    context->renderer = SDL_CreateRenderer(context->window, 0, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (context->renderer == NULL)
    {
        SDL_Log("SDL_CreateRenderer: %s\n", SDL_GetError());
        SDL_Quit();
        while (1)
            ;
    }
    SDL_Log("SDL_SetRenderDrawBlendMode");
    SDL_SetRenderDrawBlendMode(context->renderer, SDL_BLENDMODE_BLEND); // enable transparency

    SDL_Log("IMG_LoadTexture ICON");
    IMG_Init(IMG_INIT_PNG);
    logoTexture = IMG_LoadTexture(context->renderer, "iconTransparent.png");
    // SDL_Surface *logo = IMG_Load("iconTransparent.png");
    // if (logo)
    // {
    //     logoTexture = SDL_CreateTextureFromSurface(context->renderer, logo);
    //     SDL_FreeSurface(logo);
    // }
    // Create font cache
    SDL_Log("SDL_CreateTexture");
    context->yuv_text = SDL_CreateTexture(context->renderer, SDL_PIXELFORMAT_IYUV, SDL_TEXTUREACCESS_STREAMING, RESX, RESY);

    context->rect.x = 0;
    context->rect.y = 0;
    context->rect.w = RESX;
    context->rect.h = RESY;

    SDL_Log("mutexInit texture_mut");
    mutexInit(&context->texture_mut);
    SDL_Log("mutexInit frame_avail_mut");
    mutexInit(&context->frame_avail_mut);
    SDL_Log("mutexInit video_active_mut");
    mutexInit(&context->video_active_mut);
    context->frame_avail = false;
    context->video_active = false;

    PlFontData fontData, fontExtData;
    SDL_Log("plGetSharedFontByType");
    plGetSharedFontByType(&fontData, PlSharedFontType_Standard);
    plGetSharedFontByType(&fontExtData, PlSharedFontType_NintendoExt);
    SDL_Log((char *)fontData.address);
    SDL_Log("FC_CreateFont");
    context->font = FC_CreateFont();
    SDL_Log("FC_LoadFont_RW");
    FC_LoadFont_RW(context->font, context->renderer, SDL_RWFromMem((void *)fontData.address, fontData.size), SDL_RWFromMem((void *)fontExtData.address, fontExtData.size), 1, 40, FC_MakeColor(0, 0, 0, 255), TTF_STYLE_NORMAL);
    SDL_Log("initDelta");
    initDelta();
    SDL_Log("initBubbles");
    initBubbles();

    return context;
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
void strokeCircle(RenderContext *context, float centreX, float centreY, float radius, SDL_Color colour)
{
    int diameter = (radius * 2);
    int x = (radius - 1);
    int y = 0;
    int tx = 1;
    int ty = 1;
    int error = (tx - diameter);
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
void drawCircle(RenderContext *context, float centreX, float centreY, float radius, int lineThicknes, SDL_Color colour)
{
    for (int i = 0; i < lineThicknes; i++)
    {
        strokeCircle(context, centreX, centreY, radius - i, colour);
    }
}
void fillCircle(RenderContext *context, float centreX, float centreY, float radius, SDL_Color colour)
{
    for (double dy = 1; dy <= radius; dy += 1.0)
    {
        double dx = floor(sqrt((2.0 * radius * dy) - (dy * dy)));
        SDL_SetRenderDrawColor(context->renderer, colour.r, colour.g, colour.b, colour.a);
        SDL_RenderDrawLine(context->renderer, centreX - dx, centreY + dy - radius, centreX + dx, centreY + dy - radius);
        SDL_RenderDrawLine(context->renderer, centreX - dx, (centreY + 1) - dy + radius, centreX + dx, (centreY + 1) - dy + radius);
    }
}
void drawGradient(RenderContext *context, int x, int y, int w, int h, SDL_Color colourStart, SDL_Color colourEnd, int direction)
{
    int drawLines = 1;
    switch (direction)
    {
    case 1: // Top to bottom gradient
        drawLines = h;
        break;
    case 2: // Bottom to top gradient
        drawLines = h;
        break;
    case 3: // Left to right gradient
        drawLines = w;
        break;
    case 4: // Right to left gradient
        drawLines = w;
        break;
    }
    for (int i = 0; i < drawLines; i++)
    { // Top to bottom gradient
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

void renderBubbles(RenderContext *context)
{
    // Buggy right now. I need to understand C a bit better first.
    // resolveCollisions();
    for (int i = 0; i < bubblesLength; i++)
    {
        bubbles[i].vx += globalForce.vx * delta;
        bubbles[i].vy += globalForce.vy * delta;
        bubbles[i].x += bubbles[i].vx * delta;
        bubbles[i].y += bubbles[i].vy * delta;
        float negRadius = bubbles[i].r * -1;
        if (bubbles[i].y < negRadius || bubbles[i].y > 720 + bubbles[i].r + 1) // bubble off top or overflowed to bottom because large delta
        {

            float randYv = getRandomInt(20, 50) * -1;
            bubbles[i].vy = randYv;
            bubbles[i].y = 720 + bubbles[i].r;
            bool isColliding = true;
            int attempts = 3;
            while (isColliding && attempts > 3)
            {
                bubbles[i].x = getRandomInt(0, 1280);
                if (!testForCollision(bubbles[i], i))
                {
                    isColliding = false;
                }
                attempts--;
            }

            float randXv = 0;
            if (getRandomInt(0, 1) == 0)
            {
                randXv = getRandomInt(10, 25);
            }
            else
            {
                randXv = getRandomInt(10, 25) * -1;
            }
            bubbles[i].vx = randXv;
        }
        fillCircle(context, bubbles[i].x, bubbles[i].y, bubbles[i].r, bubbles[i].color);
    }
}
void drawSplash(RenderContext *context)
{
    loopStart();
    SDL_Color bg = {50, 50, 50, 255};
    SDL_ClearScreen(context, bg);

    SDL_Color bgf = {95, 0, 135, 255};
    SDL_Color bgt = {87, 1, 94, 255};
    drawGradient(context, 0, 0, 1280, 720, bgf, bgt, 1);

    renderBubbles(context);

    SDL_Color gf = {0, 0, 0, 200};
    SDL_Color gt = {0, 0, 0, 0};
    drawGradient(context, 0, 0, 1280, 180, gf, gt, 1);
    drawGradient(context, 0, 720 - 100, 1280, 180, gf, gt, 2);

    int imgW = 256;
    int imgH = 256;
    // printf("SDL_QueryTexture\n");
    // SDL_QueryTexture(logoTexture, NULL, NULL, &imgW, &imgH);
    SDL_Rect imgDest;
    imgDest.x = (1280 / 2) - (imgW / 2);
    imgDest.y = (720 / 2) - (imgH / 2);
    imgDest.w = imgW;
    imgDest.h = imgH;
    // printf("SDL_RenderCopy\n");
    // SDL_RenderCopy(context->renderer, logoTexture, NULL, &imgDest);

    SDL_Color white = {230, 230, 230, 255};
    u32 ip = gethostid();
    char str_buf[300];
    snprintf(str_buf, 300, "IP-Address: %u.%u.%u.%u\n",
             ip & 0xFF, (ip >> 8) & 0xFF, (ip >> 16) & 0xFF, (ip >> 24) & 0xFF);

    SDL_DrawText(context, 400, imgDest.y + imgH + 8, white, str_buf);

    SDL_RenderPresent(context->renderer);
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
}

void displayFrame(RenderContext *renderContext)
{
    if (checkFrameAvail(renderContext))
    {
        SDL_RenderClear(renderContext->renderer);

        mutexLock(&renderContext->texture_mut);
        SDL_UpdateYUVTexture(renderContext->yuv_text, &renderContext->rect, renderContext->YPlane, RESX,
                             renderContext->UPlane, RESX / 2,
                             renderContext->VPlane, RESX / 2);
        mutexUnlock(&renderContext->texture_mut);

        SDL_RenderCopy(renderContext->renderer, renderContext->yuv_text, NULL, NULL);
        SDL_RenderPresent(renderContext->renderer);
    }
}

void freeRenderer(RenderContext *context)
{
    free(context);
    plExit();
    IMG_Quit();
    TTF_Quit();
    SDL_Quit();
}