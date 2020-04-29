#include <switch.h>

#include "context.h"
#include "input.h"
#include "network.h"
#include "renderer.h"
void gamePadSend(JoyConSocket *connection)
{
    JoystickPosition lJoy;
    JoystickPosition rJoy;
    JoyPkg pkg;
    /* Recieve switch input and generate the package */
    hidScanInput();
    uint32_t controllersConnected = 0;
    HidControllerID player1Id;
    if (hidGetHandheldMode())
    {
        player1Id = CONTROLLER_HANDHELD;
        controllersConnected++;
    }
    else
    {
        player1Id = CONTROLLER_PLAYER_1;
    }
    for (short i = 0; i < 4; i++)
    {
        if (hidIsControllerConnected(i))
        {
            controllersConnected++;
        }
    }
    pkg.streamStart = 255;
    pkg.streamEnd = 255;
    pkg.frameRate = frameRate;
    pkg.controllerCount = controllersConnected;

    pkg.heldKeys1 = (uint32_t)hidKeysHeld(player1Id);
    hidJoystickRead(&lJoy, player1Id, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, player1Id, JOYSTICK_RIGHT);
    pkg.lJoyX1 = (int32_t)lJoy.dx;
    pkg.lJoyY1 = (int32_t)lJoy.dy;
    pkg.rJoyX1 = (int32_t)rJoy.dx;
    pkg.rJoyY1 = (int32_t)rJoy.dy;

    pkg.heldKeys2 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_2);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_2, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_2, JOYSTICK_RIGHT);
    pkg.lJoyX2 = (int32_t)lJoy.dx;
    pkg.lJoyY2 = (int32_t)lJoy.dy;
    pkg.rJoyX2 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY2 = (int32_t)rJoy.dy;

    pkg.heldKeys3 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_3);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_3, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_3, JOYSTICK_RIGHT);
    pkg.lJoyX3 = (int32_t)lJoy.dx;
    pkg.lJoyY3 = (int32_t)lJoy.dy;
    pkg.rJoyX3 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY3 = (int32_t)rJoy.dy;

    pkg.heldKeys4 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_4);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_4, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_4, JOYSTICK_RIGHT);
    pkg.lJoyX4 = (int32_t)lJoy.dx;
    pkg.lJoyY4 = (int32_t)lJoy.dy;
    pkg.rJoyX4 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY4 = (int32_t)rJoy.dy;

    pkg.heldKeys5 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_5);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_5, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_5, JOYSTICK_RIGHT);

    pkg.lJoyX5 = (int32_t)lJoy.dx;
    pkg.lJoyY5 = (int32_t)lJoy.dy;
    pkg.rJoyX5 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY5 = (int32_t)rJoy.dy;

    pkg.heldKeys6 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_6);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_6, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_6, JOYSTICK_RIGHT);
    pkg.lJoyX6 = (int32_t)lJoy.dx;
    pkg.lJoyY6 = (int32_t)lJoy.dy;
    pkg.rJoyX6 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY6 = (int32_t)rJoy.dy;

    pkg.heldKeys7 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_7);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_7, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_7, JOYSTICK_RIGHT);
    pkg.lJoyX7 = (int32_t)lJoy.dx;
    pkg.lJoyY7 = (int32_t)lJoy.dy;
    pkg.rJoyX7 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY7 = (int32_t)rJoy.dy;

    pkg.heldKeys8 = (uint32_t)hidKeysHeld(CONTROLLER_PLAYER_8);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_8, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_8, JOYSTICK_RIGHT);
    pkg.lJoyX8 = (int32_t)lJoy.dx;
    pkg.lJoyY8 = (int32_t)lJoy.dy;
    pkg.rJoyX8 = (int32_t)rJoy.dx;
    ;
    pkg.rJoyY8 = (int32_t)rJoy.dy;

    touchPosition touch;
    hidTouchRead(&touch, 0);
    pkg.touchX1 = (uint32_t)touch.px;
    pkg.touchY1 = (uint32_t)touch.py;
    hidTouchRead(&touch, 1);
    pkg.touchX2 = (uint32_t)touch.px;
    pkg.touchY2 = (uint32_t)touch.py;

    SixAxisSensorValues sixaxis;
    // You can read back up to 17 successive values at once
    hidSixAxisSensorValuesRead(&sixaxis, player1Id, 1);
    pkg.accelX = (float_t)sixaxis.accelerometer.x;
    pkg.accelY = (float_t)sixaxis.accelerometer.y;
    pkg.accelZ = (float_t)sixaxis.accelerometer.z;
    pkg.gyroX = (float_t)sixaxis.gyroscope.x;
    pkg.gyroY = (float_t)sixaxis.gyroscope.y;
    pkg.gyroZ = (float_t)sixaxis.gyroscope.z;
    sendJoyConInput(connection, &pkg);
}

void handleInput(JoyConSocket *connection)
{
    if (connectJoyConSocket(connection, 2223))
        gamePadSend(connection);
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