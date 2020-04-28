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
    unsigned int controllersConnected = 0;
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
    pkg.frameRate = frameRate;
    pkg.controllerCount = controllersConnected;
    pkg.heldKeys1 = (u32)hidKeysHeld(player1Id);
    hidJoystickRead(&lJoy, player1Id, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, player1Id, JOYSTICK_RIGHT);
    pkg.lJoyX1 = lJoy.dx;
    pkg.lJoyY1 = lJoy.dy;
    pkg.rJoyX1 = rJoy.dx;
    pkg.rJoyY1 = rJoy.dy;

    pkg.heldKeys2 = (u32)hidKeysHeld(CONTROLLER_PLAYER_2);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_2, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_2, JOYSTICK_RIGHT);
    pkg.lJoyX2 = lJoy.dx;
    pkg.lJoyY2 = lJoy.dy;
    pkg.rJoyX2 = rJoy.dx;
    pkg.rJoyY2 = rJoy.dy;

    pkg.heldKeys3 = (u32)hidKeysHeld(CONTROLLER_PLAYER_3);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_3, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_3, JOYSTICK_RIGHT);
    pkg.lJoyX3 = lJoy.dx;
    pkg.lJoyY3 = lJoy.dy;
    pkg.rJoyX3 = rJoy.dx;
    pkg.rJoyY3 = rJoy.dy;

    pkg.heldKeys4 = (u32)hidKeysHeld(CONTROLLER_PLAYER_4);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_4, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_4, JOYSTICK_RIGHT);
    pkg.lJoyX4 = lJoy.dx;
    pkg.lJoyY4 = lJoy.dy;
    pkg.rJoyX4 = rJoy.dx;
    pkg.rJoyY4 = rJoy.dy;

    pkg.heldKeys5 = (u32)hidKeysHeld(CONTROLLER_PLAYER_5);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_5, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_5, JOYSTICK_RIGHT);
    pkg.lJoyX5 = lJoy.dx;
    pkg.lJoyY5 = lJoy.dy;
    pkg.rJoyX5 = rJoy.dx;
    pkg.rJoyY5 = rJoy.dy;

    pkg.heldKeys6 = (u32)hidKeysHeld(CONTROLLER_PLAYER_6);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_6, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_6, JOYSTICK_RIGHT);
    pkg.lJoyX6 = lJoy.dx;
    pkg.lJoyY6 = lJoy.dy;
    pkg.rJoyX6 = rJoy.dx;
    pkg.rJoyY6 = rJoy.dy;

    pkg.heldKeys7 = (u32)hidKeysHeld(CONTROLLER_PLAYER_7);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_7, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_7, JOYSTICK_RIGHT);
    pkg.lJoyX7 = lJoy.dx;
    pkg.lJoyY7 = lJoy.dy;
    pkg.rJoyX7 = rJoy.dx;
    pkg.rJoyY7 = rJoy.dy;

    pkg.heldKeys8 = (u32)hidKeysHeld(CONTROLLER_PLAYER_8);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_8, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_8, JOYSTICK_RIGHT);
    pkg.lJoyX8 = lJoy.dx;
    pkg.lJoyY8 = lJoy.dy;
    pkg.rJoyX8 = rJoy.dx;
    pkg.rJoyY8 = rJoy.dy;
    touchPosition touch;
    hidTouchRead(&touch, 0);
    pkg.touchX1 = touch.px;
    pkg.touchY1 = touch.py;
    hidTouchRead(&touch, 1);
    pkg.touchX2 = touch.px;
    pkg.touchY2 = touch.py;

    SixAxisSensorValues sixaxis;
    // You can read back up to 17 successive values at once
    hidSixAxisSensorValuesRead(&sixaxis, player1Id, 1);
    pkg.accelX = sixaxis.accelerometer.x;
    pkg.accelY = sixaxis.accelerometer.y;
    pkg.accelZ = sixaxis.accelerometer.z;
    pkg.gyroX = sixaxis.gyroscope.x;
    pkg.gyroY = sixaxis.gyroscope.y;
    pkg.gyroZ = sixaxis.gyroscope.z;
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
        svcSleepThread(23333333);
    }

    freeJoyConSocket(connection);
}