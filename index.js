const Discord = require('discord.js');
const bot = new Discord.Client();
const { readFileSync } = require('fs');
const { token, prefix } = require('./token');
const { spawn } = require('child_process');
const { post } = require('axios');

let prefixes;

bot.on('ready', () => {
    prefixes = [`<@${bot.user.id}> `, '@giac '];
    console.log('ready !');
});

bot.on('message', msg => {
    if (msg.author.bot) return;
    if (
        prefixes.every(p => msg.content.indexOf(p) !== 0) &&
        !(msg.channel instanceof Discord.DMChannel)
    )
        return;
    msg.channel.startTyping();
    const commands = prefixes.reduce((s, p) => s.replace(p, ''), msg.content);
    giacCommands(msg, commands);
});

async function giacCommands(msg, commands) {
    const giacrenderer = spawn('docker', [
        'run',
        '-i',
        'discord-cas/giacrenderer'
    ]);

    let output = '';

    giacrenderer.stderr.on('data', data => {
        process.stdout.write(`\x1b[32m${data}\x1b[39m`);
    });

    giacrenderer.stdout.on('data', data => {
        output += data;
        process.stdout.write(data);
        if (output.indexOf('\n') >= 0) {
            const pictures = output.split('\n');
            output = pictures[pictures.length - 1];
            pictures.slice(0, -1).forEach(el => {
                sendPicture(msg, Buffer.from(el, 'base64'));
            });
        }
    });

    giacrenderer.on('close', code => {
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
