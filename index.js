const Discord = require('discord.js');
const bot = new Discord.Client();
const {readFileSync} = require('fs');
const {token} = JSON.parse(readFileSync('./token.json'));

bot.on('ready', () => console.log('ready !'))

bot.login(token)
