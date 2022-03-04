#ifndef _NETWORK_H
#define _NETWORK_H

#include <switch.h>
#include "context.h"

#define URL "tcp://0.0.0.0:2222"
//#define TCP_RECV_BUFFER "500000"

/* Data to send to server */
typedef struct
{
    uint64_t streamStart;
    uint32_t heldKeys1;
    int32_t lJoyX1;
    int32_t lJoyY1;
    int32_t rJoyX1;
    int32_t rJoyY1;
    uint32_t heldKeys2;
    int32_t lJoyX2;
    int32_t lJoyY2;
    int32_t rJoyX2;
    int32_t rJoyY2;
    uint32_t heldKeys3;
    int32_t lJoyX3;
    int32_t lJoyY3;
    int32_t rJoyX3;
    int32_t rJoyY3;
    uint32_t heldKeys4;
    int32_t lJoyX4;
    int32_t lJoyY4;
    int32_t rJoyX4;
    int32_t rJoyY4;
    uint32_t touchX1;
    uint32_t touchY1;
    uint32_t touchX2;
    uint32_t touchY2;
    float_t accelX;
    float_t accelY;
    float_t accelZ;
    float_t gyroX;
    float_t gyroY;
    float_t gyroZ;
    uint32_t controllerCount;
    uint64_t streamEnd;
} JoyPkg;

/* Init nx network and av network */
void network_init(const SocketInitConfig *conf);

/* Deinitialize nx network and av network*/
void network_unInit();

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