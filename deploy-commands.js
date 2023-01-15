const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
require('dotenv').config();

const enviroment = process.env.NODE_ENV;

const commandFilesDir = enviroment === "production" ? './dist/commands' : './src/commands'
const commandFilesExtension = enviroment === "production" ? '.js' : '.ts'

const commands = [];
// const commandFiles = fs.readdirSync(commandFilesDir).filter(file => file.endsWith(commandFilesExtension));
const commandFiles = fs.readdirSync('./dist/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(enviroment === 'production' ? process.env.PROD_BOT_TOKEN : process.env.DEV_BOT_TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			enviroment === 'production' ? Routes.applicationCommands(process.env.PROD_DISCORD_CLIENT_ID) :
				Routes.applicationGuildCommands(process.env.DEV_DISCORD_CLIENT_ID, process.env.TEST_DISCORD_SERVER_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		console.error(error);
	}
})();