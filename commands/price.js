const { SlashCommandSubcommandBuilder, hyperlink, bold, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const { responses } = require('../constants');

function truncateText(text, max) {
	return text.substr(0, max - 1).trim() + (text.length > max ? '...' : '');
}

const countryData = {
	'ar': {
		name: 'Argentina',
		currency: 'ARS',
		pages: [
			{
				name: 'Mercado Libre (Argentina)',
				searchUrl: 'https://listado.mercadolibre.com.ar/%S#D%5BA:%S',
				productUrl: 'https://articulo.mercadolibre.com.ar%S',
				selectors: {
					container: 'div.andes-card.ui-search-result',
					link: 'a.ui-search-link',
					price: 'span.price-tag-fraction',
					title: 'h2.ui-search-item__title.shops__item-title',
				},
			},
		],
	},
	'us': {
		name: 'United States',
		currency: 'USD',
		pages: [
			{
				name: 'Amazon (United States)',
				searchUrl: 'https://www.amazon.com/s?k=%S',
				productUrl: 'https://www.amazon.com%S',
				selectors: {
					container: 'div.s-card-container > div.a-section > div.sg-row',
					link: 'h2.a-size-mini a.a-link-normal',
					price: 'span.a-price span.a-offscreen',
					title: 'h2.a-size-mini span.a-size-medium',
				},
			},
		],
	},
	'cl': {
		name: 'Chile',
		currency: 'CLP',
		pages: [
			{
				name: 'Falabella',
				searchUrl: 'https://www.falabella.com/falabella-cl/search?Ntt=%S',
				productUrl: 'https://www.falabella.com%S',
				selectors: {
					container: 'div.pod-4_GRID',
					link: 'a',
					price: 'div.prices span.copy10',
					title: 'div.pod-details a.pod-link span > b.pod-subTitle',
				},
			},
		],
	},
};

const pages = Object.values(countryData).map((country) => country.pages).flat(1);

const ELEMENTS_LIMIT = 3;

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
		if (platform && !pages.some(page => (page.name === platform))) {
			await interaction.editReply(responses(userLanguage).missingPlatform);
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
						.setLabel(responses(userLanguage).platformInBrowser.replace('%P', page.name))
						.setURL(page.searchUrl)
						.setStyle(ButtonStyle.Link),
				)),
		);
		const replyTexts = [
			pagesScraped.length &&
				`${responses(userLanguage).extractedFrom} ${pagesScraped.map(({ name }) => name).join(' ')}`,
			`${productPrices.join('\n')}`,
			pagesWithErrorScrapping.length &&
				`${responses(userLanguage).errorScrapping} ${pagesWithErrorScrapping.map((name) => name).join(' ')}`,
		].filter(a => a);
		await interaction.editReply({ content: replyTexts.join('\n\n'), components: [...buttons] });
	},
};