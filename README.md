# cas-discord

This bot aims to integrate the giac computer algebra system into Discord.

## Commands



### `@giac <input>`

This is the main command: it runs giac with the specified input and returns stdout.

This can also be invoked by using `@CAS` (or mention whatever user the bot is running as). When interacting with the bot in a DM channel, you can ommit the prefix.

### Sample output

![zeros(x^2-x-2,x)](/screenshots/giac1.png?raw=true)
![czeros(x^2+x+1)](/screenshots/giac2.png?raw=true)
![texpand(cos(a+b))](/screenshots/giac2.png?raw=true)
![tlin(sin(x)^3)](/screenshots/giac2.png?raw=true)

## How does it work ?

I created a docker image that takes giac input and spits out the output as base64-encoded png images. The bot then decodes these images and sends them.
