#ifndef _NETWORK_H
#define _NETWORK_H

#include <switch.h>
#include "context.h"

#define URL "tcp://0.0.0.0:2222"
//#define TCP_RECV_BUFFER "500000"

/* Data to send to server */
typedef struct
{
    unsigned long heldKeys;
    short lJoyX;
    short lJoyY;
    short rJoyX;
    short rJoyY;
    short touchX;
    short touchY;
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