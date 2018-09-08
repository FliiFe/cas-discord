const Discord = require('discord.js');
const bot = new Discord.Client();
const { token } = require('./token');
const { spawn } = require('child_process');

let prefixes;

bot.on('ready', () => {
    prefixes = [`<@${bot.user.id}> `, '@giac '];
    bot.user.setGame('@CAS help')
    console.log('ready !');
});

bot.on('message', msg => {
    // don't respond to self
    if (msg.author.bot) return;
    // check if prefix is correct or that we are in a DM channel
    if (
        prefixes.every(p => msg.content.indexOf(p) !== 0) &&
        !(msg.channel instanceof Discord.DMChannel)
    )
        return;
    // Run !
    msg.channel.startTyping();
    const commands = prefixes.reduce((s, p) => s.replace(p, ''), msg.content);
    if(commands == 'help') sendHelp(msg);
    else giacCommands(msg, commands);
});

async function giacCommands(msg, commands) {
    // --rm for cleanup (no need to keep fs after the image is run)
    // --network none because there is no need for network
    // -i because we send the data via stdin
    const giacrenderer = spawn('docker', [
        'run',
        '--rm',
        '--network',
        'none',
        '-i',
        'giac-renderer'
    ]);

    let output = '';

    giacrenderer.stderr.on('data', data => {
        process.stdout.write(`\x1b[32m${data}\x1b[39m`);
    });

    giacrenderer.stdout.on('data', data => {
        output += data;
        // process.stdout.write(data);
        if (output.indexOf('\n') >= 0) {
            const pictures = output.split('\n');
            output = pictures[pictures.length - 1];
            pictures.slice(0, -1).forEach(el => {
                sendPicture(msg, Buffer.from(el, 'base64'));
            });
        }
    });

    giacrenderer.on('close', code => {
        console.log(`giac-renderer exited with code ${code}`);
    });

    giacrenderer.stdin.write(commands, 'utf8');
    giacrenderer.stdin.end();

    giacrenderer.stdout.setEncoding('utf8');
    // sendLatex(msg, latex);
}

async function sendPicture(msg, buffer) {
    if(buffer.length <= 20)
        await msg.channel.send('Error while processing input !');
    else
        await msg.channel.send('', new Discord.Attachment(buffer, 'giac.png'));
    msg.channel.stopTyping();
}

function sendHelp(msg) {
    msg.author.send("Please see http://www-fourier.ujf-grenoble.fr/~parisse/giac/doc/en/cascmd_en/ for full reference. Version française: http://www-fourier.ujf-grenoble.fr/~parisse/giac/doc/fr/cascmd_fr/");
}

bot.login(token);

process.on('uncaughtException', e => {
    console.log('Uncaught Exception...');
    console.trace(e);
});
