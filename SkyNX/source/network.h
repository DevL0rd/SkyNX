#ifndef _NETWORK_H
#define _NETWORK_H

#include <switch.h>
#include "context.h"

#define URL "tcp://0.0.0.0:2222"
//#define TCP_RECV_BUFFER "500000"

/* Data to send to server */
typedef struct
{
    u32 heldKeys1;
    s32 lJoyX1;
    s32 lJoyY1;
    s32 rJoyX1;
    s32 rJoyY1;
    u32 heldKeys2;
    s32 lJoyX2;
    s32 lJoyY2;
    s32 rJoyX2;
    s32 rJoyY2;
    u32 heldKeys3;
    s32 lJoyX3;
    s32 lJoyY3;
    s32 rJoyX3;
    s32 rJoyY3;
    u32 heldKeys4;
    s32 lJoyX4;
    s32 lJoyY4;
    s32 rJoyX4;
    s32 rJoyY4;
    u32 heldKeys5;
    s32 lJoyX5;
    s32 lJoyY5;
    s32 rJoyX5;
    s32 rJoyY5;
    u32 heldKeys6;
    s32 lJoyX6;
    s32 lJoyY6;
    s32 rJoyX6;
    s32 rJoyY6;
    u32 heldKeys7;
    s32 lJoyX7;
    s32 lJoyY7;
    s32 rJoyX7;
    s32 rJoyY7;
    u32 heldKeys8;
    s32 lJoyX8;
    s32 lJoyY8;
    s32 rJoyX8;
    s32 rJoyY8;
    u32 touchX1;
    u32 touchY1;
    u32 touchX2;
    u32 touchY2;
    float accelX;
    float accelY;
    float accelZ;
    float gyroX;
    float gyroY;
    float gyroZ;
    unsigned int controllerCount;
    unsigned int frameRate;
} JoyPkg;

/* Init nx network and av network */
void networkInit(const SocketInitConfig *conf);

/* Deinitialize nx network and av network*/
void networkDestroy();

/* Creates the context for sending joycon inputs */
JoyConSocket *createJoyConSocket();

/* Deallocate from memory the constext used to sent joycon inputs */
void freeJoyConSocket(JoyConSocket *connection);

/* Send joycon input over the network */
void sendJoyConInput(JoyConSocket *connection, const JoyPkg *pkg);

/* 
 * Binds, listens and accepts connection with the server
 * If the connection was previously opened reuses it
 */
int connectJoyConSocket(JoyConSocket *connection, int port);

#endif