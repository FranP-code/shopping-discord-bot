const { SlashCommandSubcommandBuilder } = require('discord.js');
const generateLocalizedResponses = require('../scripts/generateLocalizedResponses');
const { urlRegex } = require('../utils/constants');
require('dotenv').config();

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('suggest-custom')
		.setNameLocalizations({
			'es-ES': 'sugerencia-custom',
		})
		.setDescription('Suggest a new feature or idea for the bot')
		.setDescriptionLocalizations({
			'es-ES': 'Sugiera una nueva funcionalidad o una idea para el bot',
		})
		.addStringOption(option => option
			.setName('text')
			.setNameLocalizations({
				'es-ES': 'texto',
			})
			.setDescription('Add your suggest/idea')
			.setDescriptionLocalizations({
				'es-ES': 'Introduce tu sugerencia/idea',
			})
			.setMaxLength(1800)),
	async execute(interaction) {
		const userLanguage = interaction.locale || 'en-US';
		const suggestion = interaction.options.getString('text');
		if (!suggestion) {
			interaction.reply(generateLocalizedResponses(userLanguage).notSuggest);
			return;
		}
		if (urlRegex.test(suggestion)) {
			interaction.reply(generateLocalizedResponses(userLanguage).linksNotAllowed);
			return;
		}

		const notificationsChannel = interaction.client.channels.cache.get(process.env.NOTIFICATION_DISCORD_CHANNEL_ID);
		notificationsChannel.send(`SUGGESTION: ${suggestion}`);
		await interaction.reply(generateLocalizedResponses(userLanguage).suggestionSended);
	},
};