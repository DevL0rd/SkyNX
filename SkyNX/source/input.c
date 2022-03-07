#include <switch.h>

#include "context.h"
#include "input.h"
#include "network.h"
#include "renderer.h"

PadState pad;
PadState pad2;
PadState pad3;
PadState pad4;
HiddbgAbstractedPadHandle pads[4] = {0};
HiddbgAbstractedPadState states[4] = {0};
HidSixAxisSensorHandle handles[4];
Result rc = 0;
void gamePadSend(JoyConSocket *connection)
{
    JoyPkg pkg;
    HidAnalogStickState analog_stick_l;
    HidAnalogStickState analog_stick_r;
    pkg.streamStart = (uint64_t)UINT64_MAX; // easy identifiers for the start and stop of tcp stream
    pkg.streamEnd = (uint64_t)UINT64_MAX / 2;
    uint32_t controllerCount = 0;
    padUpdate(&pad);
    padUpdate(&pad2);
    padUpdate(&pad3);
    padUpdate(&pad4);

    if (padIsConnected(&pad))
    {
        controllerCount++;
        analog_stick_l = padGetStickPos(&pad, 0);
        analog_stick_r = padGetStickPos(&pad, 1);
        pkg.heldKeys1 = (uint32_t)padGetButtons(&pad);
        pkg.lJoyX1 = (int32_t)analog_stick_l.x;
        pkg.lJoyY1 = (int32_t)analog_stick_l.y;
        pkg.rJoyX1 = (int32_t)analog_stick_r.x;
        pkg.rJoyY1 = (int32_t)analog_stick_r.y;
    }
    else
    {
        pkg.heldKeys1 = 0;
        pkg.lJoyX1 = 0;
        pkg.lJoyY1 = 0;
        pkg.rJoyX1 = 0;
        pkg.rJoyY1 = 0;
    }

    if (padIsConnected(&pad2))
    {
        controllerCount++;
        analog_stick_l = padGetStickPos(&pad2, 0);
        analog_stick_r = padGetStickPos(&pad2, 1);
        pkg.heldKeys2 = (uint32_t)padGetButtons(&pad2);
        pkg.lJoyX2 = (int32_t)analog_stick_l.x;
        pkg.lJoyY2 = (int32_t)analog_stick_l.y;
        pkg.rJoyX2 = (int32_t)analog_stick_r.x;
        pkg.rJoyY2 = (int32_t)analog_stick_r.y;
    }
    else
    {
        pkg.heldKeys2 = 0;
        pkg.lJoyX2 = 0;
        pkg.lJoyY2 = 0;
        pkg.rJoyX2 = 0;
        pkg.rJoyY2 = 0;
    }

    if (padIsConnected(&pad3))
    {
        controllerCount++;
        analog_stick_l = padGetStickPos(&pad3, 0);
        analog_stick_r = padGetStickPos(&pad3, 1);
        pkg.heldKeys3 = (uint32_t)padGetButtons(&pad3);
        pkg.lJoyX3 = (int32_t)analog_stick_l.x;
        pkg.lJoyY3 = (int32_t)analog_stick_l.y;
        pkg.rJoyX3 = (int32_t)analog_stick_r.x;
        pkg.rJoyY3 = (int32_t)analog_stick_r.y;
    }
    else
    {
        pkg.heldKeys3 = 0;
        pkg.lJoyX3 = 0;
        pkg.lJoyY3 = 0;
        pkg.rJoyX3 = 0;
        pkg.rJoyY3 = 0;
    }

    if (padIsConnected(&pad4))
    {
        controllerCount++;
        analog_stick_l = padGetStickPos(&pad4, 0);
        analog_stick_r = padGetStickPos(&pad4, 1);
        pkg.heldKeys4 = (uint32_t)padGetButtons(&pad4);
        pkg.lJoyX4 = (int32_t)analog_stick_l.x;
        pkg.lJoyY4 = (int32_t)analog_stick_l.y;
        pkg.rJoyX4 = (int32_t)analog_stick_r.x;
        pkg.rJoyY4 = (int32_t)analog_stick_r.y;
    }
    else
    {
        pkg.heldKeys4 = 0;
        pkg.lJoyX4 = 0;
        pkg.lJoyY4 = 0;
        pkg.rJoyX4 = 0;
        pkg.rJoyY4 = 0;
    }

    pkg.controllerCount = (uint32_t)controllerCount;
    // printf("controllerCount: %d\n", controllerCount);
    // printf("%d %d %d %d %d\n", pkg.heldKeys1, pkg.lJoyX1, pkg.lJoyY1, pkg.rJoyX1, pkg.rJoyY1);
    // printf("%d %d %d %d %d\n", pkg.heldKeys2, pkg.lJoyX2, pkg.lJoyY2, pkg.rJoyX2, pkg.rJoyY2);
    // printf("%d %d %d %d %d\n", pkg.heldKeys3, pkg.lJoyX3, pkg.lJoyY3, pkg.rJoyX3, pkg.rJoyY3);
    // printf("%d %d %d %d %d\n", pkg.heldKeys4, pkg.lJoyX4, pkg.lJoyY4, pkg.rJoyX4, pkg.rJoyY4);

    HidTouchScreenState touchState = {0};
    if (hidGetTouchScreenStates(&touchState, 1))
    {
        pkg.touchX1 = (uint32_t)touchState.touches[0].x;
        pkg.touchY1 = (uint32_t)touchState.touches[0].y;
        pkg.touchX2 = (uint32_t)touchState.touches[1].x;
        pkg.touchY2 = (uint32_t)touchState.touches[1].y;
    }
    // printf("%d %d %d %d\n", pkg.touchX1, pkg.touchY1, pkg.touchX2, pkg.touchY2);
    HidSixAxisSensorState sixaxis = {0};
    u64 style_set = padGetStyleSet(&pad);
    if (style_set & HidNpadStyleTag_NpadHandheld)
        hidGetSixAxisSensorStates(handles[0], &sixaxis, 1);
    else if (style_set & HidNpadStyleTag_NpadFullKey)
        hidGetSixAxisSensorStates(handles[1], &sixaxis, 1);
    else if (style_set & HidNpadStyleTag_NpadJoyDual)
    {
        // For JoyDual, read from either the Left or Right Joy-Con depending on which is/are connected
        u64 attrib = padGetAttributes(&pad);
        if (attrib & HidNpadAttribute_IsLeftConnected)
            hidGetSixAxisSensorStates(handles[2], &sixaxis, 1);
        else if (attrib & HidNpadAttribute_IsRightConnected)
            hidGetSixAxisSensorStates(handles[3], &sixaxis, 1);
    }
    pkg.accelX = (float_t)sixaxis.acceleration.x;
    pkg.accelY = (float_t)sixaxis.acceleration.y;
    pkg.accelZ = (float_t)sixaxis.acceleration.z;
    pkg.gyroX = (float_t)sixaxis.angle.x;
    pkg.gyroY = (float_t)sixaxis.angle.y;
    pkg.gyroZ = (float_t)sixaxis.angle.z;
    // acceleration
    // angle
    // angular_velocity
    // printf("%f %f %f %f %f %f\n", pkg.accelX, pkg.accelY, pkg.accelZ, pkg.gyroX, pkg.gyroY, pkg.gyroZ);
    pkg.renderFPS = (uint32_t)getFPS();
    sendJoyConInput(connection, &pkg);
}

void handleInput(JoyConSocket *connection)
{
    if (connectJoyConSocket(connection, 2223))
        gamePadSend(connection);
}

void input_init()
{
    padConfigureInput(4, HidNpadStyleSet_NpadStandard);
    padInitialize(&pad, HidNpadIdType_No1, HidNpadIdType_Handheld);
    padInitialize(&pad2, HidNpadIdType_No2, HidNpadStyleTag_NpadJoyDual);
    padInitialize(&pad3, HidNpadIdType_No3, HidNpadStyleTag_NpadJoyDual);
    padInitialize(&pad4, HidNpadIdType_No4, HidNpadStyleTag_NpadJoyDual);

    hidInitializeTouchScreen();
    hidGetSixAxisSensorHandles(&handles[0], 1, HidNpadIdType_Handheld, HidNpadStyleTag_NpadHandheld);
    hidGetSixAxisSensorHandles(&handles[1], 1, HidNpadIdType_No1, HidNpadStyleTag_NpadFullKey);
    hidGetSixAxisSensorHandles(&handles[2], 2, HidNpadIdType_No1, HidNpadStyleTag_NpadJoyDual);
    hidStartSixAxisSensor(handles[0]);
    hidStartSixAxisSensor(handles[1]);
    hidStartSixAxisSensor(handles[2]);
    hidStartSixAxisSensor(handles[3]);
}
void input_unInit()
{

    hidStopSixAxisSensor(handles[0]);
    hidStopSixAxisSensor(handles[1]);
    hidStopSixAxisSensor(handles[2]);
    hidStopSixAxisSensor(handles[3]);
}
void inputHandlerLoop(void *dummy)
{
    JoyConSocket *connection = createJoyConSocket();

    while (appletMainLoop())
    {
        handleInput(connection);
        svcSleepThread(23333333ULL);
    }
    freeJoyConSocket(connection);
}