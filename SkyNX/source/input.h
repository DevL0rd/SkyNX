#ifndef INPUT_H
#define INPUT_H

/* Loop to handle joycon inputs and send theme to the server */
void inputHandlerLoop(void *dummy);
void input_init();
void input_unInit();
#endif