#ifndef _RENDERER_H
#define _RENDERER_H

#include <libavformat/avformat.h>
#include <libswscale/swscale.h>


#include "context.h"

/* Allocates a render context */
RenderContext* createRenderer(void);

/* Draws an image filling all screen */
void drawSplash(RenderContext *context);

/* Handles a frame received from server */
void handleFrame(RenderContext* context, VideoContext* videoContext);

/* Draws a frame */
void displayFrame(RenderContext *renderContext);

/* Deallocates the render context */
void freeRenderer(RenderContext* context);

/* Sets the variable that indicates that there's a frame ready to be drawn */
void setFrameAvail(RenderContext* context);

/* Checks if a frame is ready to be drawn and sets that variable to false */
bool checkFrameAvail(RenderContext* context);

/* Returns true if there is a video playing right now */
bool isVideoActive(RenderContext *context);

/* Sets the video-playing status */
void setVideoActive(RenderContext *context, bool active);

#endif