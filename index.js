const Discord = require('discord.js');
const bot = new Discord.Client();
const { readFileSync } = require('fs');
const { token, prefix } = JSON.parse(readFileSync('./token.json'));
const { spawn } = require('child_process');
const { post } = require('axios');
const api = 'http://rtex.probablyaweb.site/api/v2';

bot.on('ready', () => console.log('ready !'));

bot.on('message', msg => {
    if (msg.author.bot) return;
    if (msg.content[0] !== prefix && !(msg.channel instanceof Discord.DMChannel)) return;
    if ([0, 1].indexOf(msg.content.indexOf('giac')) >= 0) {
        msg.channel.startTyping();
        const commands = msg.content.split(' ').slice(1).join(' ');
        giacCommands(msg, commands);
    }
});

async function giacCommands(msg, commands) {
    const giacrenderer = spawn('docker', ['run', '-i', 'discord-cas/giacrenderer']);

    let output = '';

    giacrenderer.stderr.on('data', (data) => {
        process.stdout.write(`\x1b[32m${data}\x1b[39m`);
    });

    giacrenderer.stdout.on('data', (data) => {
        output += data;
        process.stdout.write(data);
        if (output.indexOf('\n') >= 0) {
            const pictures = output.split('\n');
            output = pictures[pictures.length-1];
            pictures.slice(0,-1).forEach(el => {
                sendPicture(msg, Buffer.from(el, 'base64'));
            });
        }
    });

    giacrenderer.on('close', (code) => {
        console.log(`giacrenderer exited with code ${code}`);
    });

    giacrenderer.stdin.write(commands, 'utf8');
    giacrenderer.stdin.end();

    giacrenderer.stdout.setEncoding('utf8');
    // sendLatex(msg, latex);
}

async function sendPicture(msg, buffer) {
    await msg.channel.send('', new Discord.Attachment(buffer, 'giac.png'));
    msg.channel.stopTyping();
}

bot.login(token);

process.on('uncaughtException', e => {
    console.log('Uncaught Exception...');
    console.trace(e);
});
