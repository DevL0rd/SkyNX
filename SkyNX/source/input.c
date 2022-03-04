#include <switch.h>

#include "context.h"
#include "input.h"
#include "network.h"
#include "renderer.h"

PadState pad;
HiddbgAbstractedPadHandle pads[4] = {0};
HiddbgAbstractedPadState states[4] = {0};
HidSixAxisSensorHandle handles[4];
s32 tmpout = 0;
Result rc = 0;
void gamePadSend(JoyConSocket *connection)
{
    JoyPkg pkg;

    pkg.streamStart = (uint64_t)UINT64_MAX; // easy identifiers for the start and stop of tcp stream
    pkg.streamEnd = (uint64_t)UINT64_MAX / 2;
    pkg.controllerCount = (uint32_t)1;

    tmpout = 0;
    rc = hiddbgGetAbstractedPadsState(pads, states, sizeof(pads) / sizeof(u64), &tmpout);

    // if (tmpout>=1) {
    //     s8 AbstractedVirtualPadId=0;

    //     // Setup state. You could also construct it without using hiddbgGetAbstractedPadsState, if preferred.

    //     // Set type to one that's usable with state-merge. Note that this is also available with Hdls.
    //     states[0].type = BIT(1);
    //     // Use state-merge for the above controller, the state will be merged with an existing controller.
    //     // For a plain virtual controller, use NpadInterfaceType_Bluetooth, and update the above type value.
    //     states[0].npadInterfaceType = HidNpadInterfaceType_Rail;

    //     states[0].state.buttons |= HidNpadButton_ZL;

    //     rc = hiddbgSetAutoPilotVirtualPadState(AbstractedVirtualPadId, &states[0]);
    //     printf("hiddbgSetAutoPilotVirtualPadState(): 0x%x\n", rc);
    // }

    pkg.heldKeys1 = (uint32_t)states[0].state.buttons;
    pkg.lJoyX1 = (int32_t)states[0].state.analog_stick_l.x;
    pkg.lJoyY1 = (int32_t)states[0].state.analog_stick_l.y;
    pkg.rJoyX1 = (int32_t)states[0].state.analog_stick_r.x;
    pkg.rJoyY1 = (int32_t)states[0].state.analog_stick_r.y;

    pkg.heldKeys2 = (uint32_t)states[1].state.buttons;
    pkg.lJoyX2 = (int32_t)states[1].state.analog_stick_l.x;
    pkg.lJoyY2 = (int32_t)states[1].state.analog_stick_l.y;
    pkg.rJoyX2 = (int32_t)states[1].state.analog_stick_r.x;
    pkg.rJoyY2 = (int32_t)states[1].state.analog_stick_r.y;

    pkg.heldKeys3 = (uint32_t)states[2].state.buttons;
    pkg.lJoyX3 = (int32_t)states[2].state.analog_stick_l.x;
    pkg.lJoyY3 = (int32_t)states[2].state.analog_stick_l.y;
    pkg.rJoyX3 = (int32_t)states[2].state.analog_stick_r.x;
    pkg.rJoyY3 = (int32_t)states[2].state.analog_stick_r.y;

    pkg.heldKeys4 = (uint32_t)states[3].state.buttons;
    pkg.lJoyX4 = (int32_t)states[3].state.analog_stick_l.x;
    pkg.lJoyY4 = (int32_t)states[3].state.analog_stick_l.y;
    pkg.rJoyX4 = (int32_t)states[3].state.analog_stick_r.x;
    pkg.rJoyY4 = (int32_t)states[3].state.analog_stick_r.y;

    HidTouchScreenState touchState = {0};
    if (hidGetTouchScreenStates(&touchState, 1))
    {
        pkg.touchX1 = (uint32_t)touchState.touches[0].x;
        pkg.touchY1 = (uint32_t)touchState.touches[0].y;
        pkg.touchX2 = (uint32_t)touchState.touches[1].x;
        pkg.touchY2 = (uint32_t)touchState.touches[1].y;
    }

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
    padInitializeAny(&pad);
    rc = hiddbgInitialize();
    hidInitializeTouchScreen();
    // It's necessary to initialize these separately as they all have different handle values
    HidSixAxisSensorHandle handles[4];
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
    hiddbgUnsetAllAutoPilotVirtualPadState();
    hiddbgExit();
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