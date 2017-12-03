# cas-discord

This bots aims to integrate multiple CAS interfaces right into Discord.

## Commands

This bot uses the prefix `=`, but should not interfere with other bots with the same prefix (e.g. MathsBot).

### `=giac <input>`

This is the main command: it runs giac with the specified input and returns stdout.

## About giac.js

The file `giac.js` is a version of giac compiled with emscripten **by the giac team**. I copied it as-is without any modification. It is
up to you to trust this file or not.

The original file is hosted [here](https://www-fourier.ujf-grenoble.fr/~parisse/giac.js)
