const fs = require('fs');
const path = require('path');
const { Collection, Client, GatewayIntentBits, Events } = require('discord.js');
const { getRandomElementFromArray } = require('./constants');
require('dotenv').config();

const enviroment = process.env.NODE_ENV;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
	console.log('working');
});

client.login(enviroment === 'production' ? process.env.PROD_BOT_TOKEN : process.env.DEV_BOT_TOKEN);

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
	else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (enviroment !== 'production' && interaction.user.id !== process.env.MY_DISCORD_USER_ID) {
		interaction.reply(`The dev instance of this bot is only for ${getRandomElementFromArray([`<@${process.env.MY_DISCORD_USER_ID}>`, 'the king'])}`);
		return;
	}
	const command = interaction.client.commands.get(interaction.commandName);
	if (interaction.isChatInputCommand()) {
		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
	else if (interaction.isAutocomplete()) {
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		}
		catch (error) {
			console.error(error);
		}
	}

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
});

