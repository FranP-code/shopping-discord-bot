const { SlashCommandSubcommandBuilder } = require('discord.js');
const { urlRegex, responses } = require('../constants');
require('dotenv').config();

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('suggest-option')
		.setNameLocalizations({
			'es-ES': 'sugerir-opción',
		})
		.setDescription('Suggest a new country and/or platform for add to the bot')
		.setDescriptionLocalizations({
			'es-ES': 'Sugiera un nuevo país y/o plataforma para agregar al bot',
		})
		.addStringOption(option => option
			.setName('country')
			.setNameLocalizations({
				'es-ES': 'país',
			})
			.setDescription('Add a country')
			.setDescriptionLocalizations({
				'es-ES': 'Añadir un país',
			})
			.setMaxLength(200))
		.addStringOption(option => option
			.setName('platform')
			.setNameLocalizations({
				'es-ES': 'plataforma',
			})
			.setDescription('Add a platform for search')
			.setDescriptionLocalizations({
				'es-ES': 'Añadir una plataforma para la busqueda',
			})),
	async execute(interaction) {
		const userLanguage = interaction.locale || 'en-US';
		const country = interaction.options.getString('country');
		const platform = interaction.options.getString('platform');
		const suggestion = [country, platform].filter(a => a).join(' - ');
		if (!country && !platform) {
			interaction.reply(responses(userLanguage).notSuggest);
			return;
		}
		if (urlRegex.test(suggestion)) {
			interaction.reply(responses(userLanguage).linksNotAllowed);
			return;
		}
		const notificationsChannel = interaction.client.channels.cache.get(process.env.NOTIFICATION_DISCORD_CHANNEL_ID);
		notificationsChannel.send(`SUGGESTION of country: ${suggestion}`);
		await interaction.reply(responses(userLanguage).suggestionSended);
	},
};