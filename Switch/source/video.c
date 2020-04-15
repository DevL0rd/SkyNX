#include <libavutil/imgutils.h>
#include <libavutil/samplefmt.h>
#include <libavutil/timestamp.h>

#include <switch.h>

#include "video.h"
#include "network.h"
#include "renderer.h"

VideoContext *createVideoContext()
{
    VideoContext *context = (VideoContext *)malloc(sizeof(VideoContext));
    context->fmt_ctx = NULL;
    context->video_dec_ctx = NULL;
    context->video_stream = NULL;
    context->video_stream_idx = -1;
    context->rgbframe = NULL;
    context->video_frame_count = 0;

    for (size_t i = 0; i < 4; i++)
        context->video_dst_data[i] = NULL;

    // Frame
    context->frame = av_frame_alloc();
    if (context->frame == NULL)
    {
        fprintf(stderr, "Could not allocate frame\n");
        return NULL;
    }

    // RGBA Frame
    context->rgbframe = av_frame_alloc();
    context->rgbframe->width = RESX;
    context->rgbframe->height = RESY;
    context->rgbframe->format = AV_PIX_FMT_RGBA;
    av_image_alloc(context->rgbframe->data,
                   context->rgbframe->linesize,
                   context->rgbframe->width,
                   context->rgbframe->height,
                   context->rgbframe->format, 32);

    return context;
}

void freeVideoContext(VideoContext *context)
{
    avcodec_free_context(&(context->video_dec_ctx));
    avformat_close_input(&(context->fmt_ctx));
    av_frame_free(&(context->frame));
    av_free(context->video_dst_data[0]);
    free(context);
}

/* Decodes a single frame and returns 0 on success */
int decode_frame(AVCodecContext *avctx, AVFrame *frame, int *got_frame, AVPacket *pkt)
{
    int ret;
    *got_frame = 0;

    if (pkt)
    {
        ret = avcodec_send_packet(avctx, pkt);
        if (ret < 0)
            return ret == AVERROR_EOF ? 0 : ret;
    }

    ret = avcodec_receive_frame(avctx, frame);
    if (ret < 0 && ret != AVERROR(EAGAIN) && ret != AVERROR_EOF)
        return ret;
    if (ret >= 0)
        *got_frame = 1;

    return 0;
}

/* Returns 1 if frame format is the same as the AVCodecContext format */
int expected_frame_format(AVCodecContext *avctx, AVFrame *frame)
{
    int width = avctx->width;
    int height = avctx->height;
    enum AVPixelFormat pix_fmt = avctx->pix_fmt;

    return frame->width == width || frame->height == height || frame->format == pix_fmt;
}

static int decode_packet(VideoContext *context, int *got_frame, AVPacket *pkt)
{
    if (pkt->stream_index == context->video_stream_idx &&
        decode_frame(context->video_dec_ctx, context->frame, got_frame, pkt) == 0)
    {
        if (!expected_frame_format(context->video_dec_ctx, context->frame))
        {
            fprintf(stderr, "Error: Width, height and pixel format have to be "
                            "constant in a rawvideo file, but the width, height or "
                            "pixel format of the input video changed:\n"
                            "old: width = %d, height = %d, format = %s\n"
                            "new: width = %d, height = %d, format = %s\n",
                    context->video_dec_ctx->width,
                    context->video_dec_ctx->height,
                    av_get_pix_fmt_name(context->video_dec_ctx->pix_fmt),
                    context->frame->width, context->frame->height,
                    av_get_pix_fmt_name(context->frame->format));
            return -1;
        }

        handleFrame(context->renderContext, context);
    }
    else
    {
        fprintf(stderr, "Error decoding video frame \n");
        return -1;
    }

    return context->frame->pkt_size;
}

static int open_codec_context(VideoContext *context, enum AVMediaType type)
{
    int ret, stream_index;
    AVStream *st;
    AVCodec *dec = NULL;

    ret = av_find_best_stream(context->fmt_ctx, type, -1, -1, NULL, 0);
    if (ret < 0)
    {
        fprintf(stderr, "Could not find %s stream in input file \n",
                av_get_media_type_string(type));
        return ret;
    }
    else
    {
        stream_index = ret;
        st = context->fmt_ctx->streams[stream_index];
        // find decoder for the stream

        dec = avcodec_find_decoder(st->codecpar->codec_id);
        if (dec == NULL)
        {
            fprintf(stderr, "Failed to find %s codec\n",
                    av_get_media_type_string(type));
            return AVERROR(EINVAL);
        }
        // Allocate a codec context for the decoder
        context->video_dec_ctx = avcodec_alloc_context3(dec);
        if (context->video_dec_ctx == NULL)
        {
            fprintf(stderr, "Failed to allocate the %s codec context\n",
                    av_get_media_type_string(type));
            return AVERROR(ENOMEM);
        }
        /*
        Copy codec parameters from input stream to output codec context
        */

        if ((ret = avcodec_parameters_to_context(context->video_dec_ctx, st->codecpar)) < 0)
        {
            fprintf(stderr, "Failed to copy %s codec parameters to decoder context\n",
                    av_get_media_type_string(type));
            return ret;
        }
        //Init the decoders, without reference counting

        if ((ret = avcodec_open2(context->video_dec_ctx, dec, NULL)) < 0)
        {
            fprintf(stderr, "Failed to open %s codec\n",
                    av_get_media_type_string(type));
            return ret;
        }
        context->video_stream_idx = stream_index;
    }
    return 0;
}

void videoLoop(void *context_ptr)
{
    VideoContext* context = (VideoContext*) context_ptr;
    while(appletMainLoop())
        handleVid(context);
}

int handleVid(VideoContext *context)
{
    int ret = 0;
    int got_frame = 0;
    AVFormatContext *fmt_ctx = NULL;
    AVPacket pkt;

    // setting TCP input options
    AVDictionary *opts = 0;
    av_dict_set(&opts, "listen", "1", 0); // set option for listening
    av_dict_set(&opts, "probesize", "50000", 0);

    //open input file, and allocate format context
    ret = avformat_open_input(&fmt_ctx, URL, 0, &opts);
    if (ret < 0)
    {
        char errbuf[100];
        av_strerror(ret, errbuf, 100);

        fprintf(stderr, "Input Error %s\n", errbuf);
        return ret;
    }

    setVideoActive(context->renderContext, true);

    context->fmt_ctx = fmt_ctx;

    // Retrieve stream information
    if (avformat_find_stream_info(fmt_ctx, NULL) < 0)
    {
        fprintf(stderr, "Could not find stream information\n");
        return ret;
    }

    // Context for the video
    if (open_codec_context(context, AVMEDIA_TYPE_VIDEO) >= 0)
    {
        context->video_stream = fmt_ctx->streams[context->video_stream_idx];

        // Allocate image where the decoded image will be put
        ret = av_image_alloc(context->video_dst_data,
                             context->video_dst_linesize,
                             context->video_dec_ctx->width,
                             context->video_dec_ctx->height,
                             context->video_dec_ctx->pix_fmt, 1);
        if (ret < 0)
        {
            char errbuf[100];
            av_strerror(ret, errbuf, 100);
            fprintf(stderr, "Could not allocate raw video buffer %s\n", errbuf);
            return ret;
        }
    }

    //dump input information to stderr
    //av_dump_format(context->fmt_ctx, 0, URL, 0);

    if (context->video_stream == NULL)
    {
        fprintf(stderr, "Could not find stream in the input, aborting\n");
        ret = 1;
        return ret;
    }

    //initialize packet, set data to NULL, let the demuxer fill it

    av_init_packet(&pkt);
    pkt.data = NULL;
    pkt.size = 0;

    //read frames from the file
    while (av_read_frame(fmt_ctx, &pkt) >= 0)
    {
        AVPacket orig_pkt = pkt;
        do
        {
            ret = decode_packet(context, &got_frame, &pkt);
            if (ret < 0)
                break;
            pkt.data += ret;
            pkt.size -= ret;
        }
        while (pkt.size > 0);
        av_packet_unref(&orig_pkt);
    }

    //flush cached frames
    pkt.data = NULL;
    pkt.size = 0;
    do
    {
        decode_packet(context, &got_frame, &pkt);
    }
    while (got_frame);

    printf("Stream finished.\n");
    checkFrameAvail(context->renderContext);
    setVideoActive(context->renderContext, false);

    return ret;
}