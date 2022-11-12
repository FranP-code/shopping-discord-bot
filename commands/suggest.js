const { SlashCommandSubcommandBuilder } = require('discord.js');
require('dotenv').config();

const responses = {
	'suggestionSended': {
		'en-US': `Suggestion sended to <@${process.env.MY_DISCORD_USER_ID}>`,
		'es-ES': `Sugerencia enviada a <@${process.env.MY_DISCORD_USER_ID}>`,
	},
};

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('suggest')
		.setNameLocalizations({
			'es-ES': 'sugerir',
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

		const notificationsChannel = interaction.client.channels.cache.get(process.env.NOTIFICATION_DISCORD_CHANNEL_ID);
		notificationsChannel.send(`SUGGESTION: ${suggestion}`);
		await interaction.reply(responses.suggestionSended[userLanguage]);
	},
};