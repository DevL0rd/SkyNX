#include <switch.h>

#include "context.h"
#include "input.h"
#include "network.h"

void gamePadSend(JoyConSocket *connection)
{
    JoystickPosition lJoy;
    JoystickPosition rJoy;
    JoyPkg pkg;
    HidControllerID conID;
    /* Recieve switch input and generate the package */
    hidScanInput();
    short controllersConnected = 0;
    for (short i = 0; i < 4; i++)
    {
        if (hidIsControllerConnected(i))
        {
            controllersConnected++;
        }
    }
    pkg.controllerCount = controllersConnected;

    conID = hidGetHandheldMode() ? CONTROLLER_HANDHELD : CONTROLLER_PLAYER_1;
    pkg.heldKeys1 = hidKeysHeld(conID);
    hidJoystickRead(&lJoy, conID, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, conID, JOYSTICK_RIGHT);
    pkg.lJoyX1 = lJoy.dx;
    pkg.lJoyY1 = lJoy.dy;
    pkg.rJoyX1 = rJoy.dx;
    pkg.rJoyY1 = rJoy.dy;

    pkg.heldKeys2 = hidKeysHeld(CONTROLLER_PLAYER_2);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_2, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_2, JOYSTICK_RIGHT);
    pkg.lJoyX2 = lJoy.dx;
    pkg.lJoyY2 = lJoy.dy;
    pkg.rJoyX2 = rJoy.dx;
    pkg.rJoyY2 = rJoy.dy;

    pkg.heldKeys3 = hidKeysHeld(CONTROLLER_PLAYER_3);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_3, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_3, JOYSTICK_RIGHT);
    pkg.lJoyX3 = lJoy.dx;
    pkg.lJoyY3 = lJoy.dy;
    pkg.rJoyX3 = rJoy.dx;
    pkg.rJoyY3 = rJoy.dy;

    pkg.heldKeys4 = hidKeysHeld(CONTROLLER_PLAYER_4);
    hidJoystickRead(&lJoy, CONTROLLER_PLAYER_4, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_PLAYER_4, JOYSTICK_RIGHT);
    pkg.lJoyX4 = lJoy.dx;
    pkg.lJoyY4 = lJoy.dy;
    pkg.rJoyX4 = rJoy.dx;
    pkg.rJoyY4 = rJoy.dy;

    touchPosition touch;
    hidTouchRead(&touch, 0);
    pkg.touchX1 = touch.px;
    pkg.touchY1 = touch.py;
    hidTouchRead(&touch, 1);
    pkg.touchX2 = touch.px;
    pkg.touchY2 = touch.py;
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