const { SlashCommandSubcommandBuilder, hyperlink, bold, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const { countryData, DISCORD_MESSAGE_LENGTH_LIMIT } = require('../utils/constants');
const truncateText = require('../scripts/truncateText');
const generateLocalizedResponses = require('../scripts/generateLocalizedResponses');

const pages = Object.values(countryData).map((country) => country.pages).flat(1);

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('prices')
		.setNameLocalizations({
			'es-ES': 'precios',
		})
		.setDescription('Get the prices of a product')
		.setDescriptionLocalizations({
			'es-ES': 'Consigue los precios de algún producto',
		})
		.addStringOption(option => option
			.setName('product')
			.setNameLocalizations({
				'es-ES': 'producto',
			})
			.setDescription('Product that you want to search')
			.setDescriptionLocalizations({
				'es-ES': 'Producto que quieres buscar',
			})
			.setRequired(true)
			.setMaxLength(200))
		.addStringOption(option => option
			.setName('country')
			.setNameLocalizations({
				'es-ES': 'país',
			})
			.setDescription('Country where search the prices')
			.setDescriptionLocalizations({
				'es-ES': 'País en donde encontrar los precios',
			})
			.addChoices(
				...Object.entries(countryData).map(([key, value]) => ({
					name: value.name,
					value: key,
				})),
			))
		.addStringOption(option => option
			.setName('platform')
			.setNameLocalizations({
				'es-ES': 'plataforma',
			})
			.setDescription('Specify a platform to search')
			.setDescriptionLocalizations({
				'es-ES': 'Especificar una plataforma para la busqueda',
			})
			.setMaxLength(200)
			.setAutocomplete(true),
		)
		.addIntegerOption(option => option
			.setName('limit')
			.setNameLocalizations({
				'es-ES': 'límite',
			})
			.setDescription('Define the limit of results of search')
			.setDescriptionLocalizations({
				'es-ES': 'Definir el límite de resultados de la busqueda',
			})
			.setMaxValue(5)
			,
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const country = interaction.options.getString('country');
		const choices = (country ? countryData[country].pages : pages).map(page => (page.name));
		const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction) {
		const userLanguage = interaction.locale || 'en-US';
		await interaction.deferReply();
		const product = interaction.options.getString('product');
		const platform = interaction.options.getString('platform');
		const ELEMENTS_LIMIT = interaction.options.getInteger('limit') || 3;
		if (platform && !pages.some(page => (page.name === platform))) {
			await interaction.editReply(generateLocalizedResponses(userLanguage).missingPlatform);
			return;
		}
		const country = interaction.options.getString('country') ||
			(platform ?
				Object.entries(countryData)
					.map(([key, value]) => value.pages.some(page => page.name === platform) ? key : false)
					.filter(a => a)[0]
				: 'us'
			);
		const countryPages = countryData[country].pages.filter(countryPage => platform ? countryPage.name === platform : countryPage);
		const productPrices = [];
		const pagesScraped = [];
		const pagesWithErrorScrapping = [];
		for (const countryPage of countryPages) {
			try {
				const browser = await puppeteer.launch({
					args: ['--no-sandbox'],
				}) ;
				const page = await browser.newPage();
				const searchUrl = countryPage.searchUrl.replace('%S', product);
				const response = await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
				const body = await response.text();

				const { window: { document } } = new jsdom.JSDOM(body);

				const products = document.querySelectorAll(countryPage.selectors.container);
				if (!products.length) {
					throw Error();
				}
				products
					.forEach((element) => {
						if (productPrices.length >= ELEMENTS_LIMIT) {
							return;
						}
						try {
							const productRelativePath = element
								.querySelector(countryPage.selectors.link)
								.getAttribute('href')
								.replace(/.*\/\/[^/]*/, '');
							const productName = element.querySelector(countryPage.selectors.title).textContent;
							const link = hyperlink(
								truncateText(productName, 100),
								countryPage.productUrl.replace('%S', encodeURI(productRelativePath)),
							);
							const priceNumber = element.querySelector(countryPage.selectors.price).textContent.replace('$', '').replace(' ', '');
							const price = `${countryData[country].currency} ${bold(priceNumber)}`;
							productPrices.push(`${link} | ${price}`);
						}
						catch (err) {
							console.log(`FUCK ${countryPage.name} MAQUETATION`);
							console.error(err);
						}
					});
				await browser.close();
				pagesScraped.push({ name: countryPage.name, searchUrl: encodeURI(searchUrl) });
			}
			catch (err) {
				pagesWithErrorScrapping.push(countryPage.name);
				console.log(`FUCK ${countryPage.name}`);
				console.error(err);
			}
		}
		const buttons = pagesScraped.map(page =>
			(new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setLabel(generateLocalizedResponses(userLanguage).platformInBrowser.replace('%P', page.name))
						.setURL(page.searchUrl)
						.setStyle(ButtonStyle.Link),
				)),
		);
		const replyTexts = [
			pagesScraped.length &&
				`${generateLocalizedResponses(userLanguage).extractedFrom} ${pagesScraped.map(({ name }) => name).join(' ')}`,
			`${productPrices.join('\n')}`,
			pagesWithErrorScrapping.length &&
				`${generateLocalizedResponses(userLanguage).errorScrapping} ${pagesWithErrorScrapping.map((name) => name).join(' ')}`,
		].filter(a => a);
		const response = replyTexts.join('\n\n');
		let content;
		if (response.length >= DISCORD_MESSAGE_LENGTH_LIMIT) {
			content = generateLocalizedResponses(userLanguage).discordMessageLengthLimit;
		}
		else {
			content = response;
		}
		await interaction.editReply({ content, components: [...buttons] });
	},
};