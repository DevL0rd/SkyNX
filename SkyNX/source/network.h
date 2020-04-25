#ifndef _NETWORK_H
#define _NETWORK_H

#include <switch.h>
#include "context.h"

#define URL "tcp://0.0.0.0:2222"
//#define TCP_RECV_BUFFER "500000"

/* Data to send to server */
typedef struct
{
    unsigned long heldKeys1;
    short lJoyX1;
    short lJoyY1;
    short rJoyX1;
    short rJoyY1;
    unsigned long heldKeys2;
    short lJoyX2;
    short lJoyY2;
    short rJoyX2;
    short rJoyY2;
    unsigned long heldKeys3;
    short lJoyX3;
    short lJoyY3;
    short rJoyX3;
    short rJoyY3;
    unsigned long heldKeys4;
    short lJoyX4;
    short lJoyY4;
    short rJoyX4;
    short rJoyY4;
    short touchX1;
    short touchY1;
    short touchX2;
    short touchY2;
    float accelX;
    float accelY;
    float accelZ;
    float gyroX;
    float gyroY;
    float gyroZ;
    short controllerCount;
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