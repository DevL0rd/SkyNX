#include <switch.h>

#include "context.h"
#include "input.h"
#include "network.h"

void gamePadSend(JoyConSocket *connection)
{
    JoystickPosition lJoy;
    JoystickPosition rJoy;
    touchPosition touch;
    JoyPkg pkg;

    /* Recieve switch input and generate the package */
    hidScanInput();
    pkg.heldKeys = hidKeysHeld(CONTROLLER_P1_AUTO);
    hidJoystickRead(&lJoy, CONTROLLER_P1_AUTO, JOYSTICK_LEFT);
    hidJoystickRead(&rJoy, CONTROLLER_P1_AUTO, JOYSTICK_RIGHT);
    pkg.lJoyX = lJoy.dx;
    pkg.lJoyY = lJoy.dy;
    pkg.rJoyX = rJoy.dx;
    pkg.rJoyY = rJoy.dy;
    hidTouchRead(&touch, 0);
    pkg.touchX = touch.px;
    pkg.touchY = touch.py;
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