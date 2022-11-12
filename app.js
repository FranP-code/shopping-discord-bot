const { GatewayIntentBits } = require('discord.js');
const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
	console.log('working');
	console.log(client.user);
});

client.login(process.env.BOT_TOKEN);