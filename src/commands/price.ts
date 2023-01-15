import { AutocompleteInteraction, CommandOptionChoiceResolvableType } from 'discord.js'
import { countryData } from '../utils/constants'

const { SlashCommandSubcommandBuilder, hyperlink, bold, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const puppeteer = require('puppeteer')
const jsdom = require('jsdom')
const { responses } = require('../../constants')

const pages = Object.values(countryData).map((country) => country.pages).flat(1)

const ELEMENTS_LIMIT = 3

export default {
	data: new SlashCommandSubcommandBuilder()
		.setName('prices')
		.setNameLocalizations({
			'es-ES': 'precios',
		})
		.setDescription('Get the prices of a product')
		.setDescriptionLocalizations({
			'es-ES': 'Consigue los precios de algún producto',
		})
		.addStringOption((option: any) => option
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
		.addStringOption((option: any) => option
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
		.addStringOption((option: any) => option
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
	async autocomplete(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused()
		const country = interaction.options.getString('country')
		const choices = (country ? countryData[country].pages : pages).map(page => (page.name))
		const filtered = choices.filter((choice: string) => choice.startsWith(focusedValue))
		await interaction.respond(
			filtered.map((choice: CommandOptionChoiceResolvableType) => ({ name: choice, value: choice })),
		)
	},
	async execute(interaction) {
		const userLanguage = interaction.locale || 'en-US'
		await interaction.deferReply()
		const product = interaction.options.getString('product')
		const platform = interaction.options.getString('platform')
		if (platform && !pages.some(page => (page.name === platform))) {
			await interaction.editReply(responses(userLanguage).missingPlatform)
			return
		}
		const country = interaction.options.getString('country') ||
			(platform ?
				Object.entries(countryData)
					.map(([key, value]) => value.pages.some(page => page.name === platform) ? key : false)
					.filter(a => a)[0]
				: 'us'
			)
		const countryPages = countryData[country].pages.filter(countryPage => platform ? countryPage.name === platform : countryPage)
		const productPrices = []
		const pagesScraped = []
		const pagesWithErrorScrapping = []
		for (const countryPage of countryPages) {
			try {
				const browser = await puppeteer.launch({
					args: ['--no-sandbox'],
				}) 
				const page = await browser.newPage()
				const searchUrl = countryPage.searchUrl.replace('%S', product)
				const response = await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })
				const body = await response.text()

				const { window: { document } } = new jsdom.JSDOM(body)

				const products = document.querySelectorAll(countryPage.selectors.container)
				if (!products.length) {
					throw Error()
				}
				products
					.forEach((element) => {
						if (productPrices.length >= ELEMENTS_LIMIT) {
							return
						}
						try {
							const productRelativePath = element
								.querySelector(countryPage.selectors.link)
								.getAttribute('href')
								.replace(/.*\/\/[^/]*/, '')
							const productName = element.querySelector(countryPage.selectors.title).textContent
							const link = hyperlink(
								truncateText(productName, 100),
								countryPage.productUrl.replace('%S', encodeURI(productRelativePath)),
							)
							const priceNumber = element.querySelector(countryPage.selectors.price).textContent.replace('$', '').replace(' ', '')
							const price = `${countryData[country].currency} ${bold(priceNumber)}`
							productPrices.push(`${link} | ${price}`)
						}
						catch (err) {
							console.log(`FUCK ${countryPage.name} MAQUETATION`)
							console.error(err)
						}
					})
				await browser.close()
				pagesScraped.push({ name: countryPage.name, searchUrl: encodeURI(searchUrl) })
			}
			catch (err) {
				pagesWithErrorScrapping.push(countryPage.name)
				console.log(`FUCK ${countryPage.name}`)
				console.error(err)
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
		)
		const replyTexts = [
			pagesScraped.length &&
				`${responses(userLanguage).extractedFrom} ${pagesScraped.map(({ name }) => name).join(' ')}`,
			`${productPrices.join('\n')}`,
			pagesWithErrorScrapping.length &&
				`${responses(userLanguage).errorScrapping} ${pagesWithErrorScrapping.map((name) => name).join(' ')}`,
		].filter(a => a)
		const response = replyTexts.join('\n\n')
		let content
		if (response.length >= DISCORD_MESSAGE_LENGTH_LIMIT) {
			content = responses(userLanguage).discordMessageLengthLimit
		}
		await interaction.editReply({ content, components: [...buttons] })
	},
}