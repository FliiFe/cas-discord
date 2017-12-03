const Discord = require('discord.js');
const bot = new Discord.Client();
const {readFileSync} = require('fs');
const {token} = JSON.parse(readFileSync('./token.json'));
const giac = require('./giac.js').cwrap('caseval', 'string', ['string']);
const a2l = require('asciimath-to-latex');

bot.on('ready', () => console.log('ready !'));

bot.on('message', msg => {
    if(msg.content[0] !== '=') return;
    if(msg.content.indexOf('=giac') === 0) {
        if(msg.content[5] === 'l') {
            msg.channel.send('=tex ' + a2l(giac(msg.content.slice(7))))
                .then(message => {
                    setTimeout(() => message.delete(), 1000);
                }).catch(e => console.trace(e));
        } else {
            msg.reply(giac(msg.content.slice(6)));
        }
    }
});

bot.login(token);
