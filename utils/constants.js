require('dotenv').config();

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

const DISCORD_MESSAGE_LENGTH_LIMIT = 2000;

const responsesTexts = {
	suggestionSended: {
		'en-US': `Suggestion sended to <@${process.env.MY_DISCORD_USER_ID}>`,
		'es-ES': `Sugerencia enviada a <@${process.env.MY_DISCORD_USER_ID}>`,
	},
	extractedFrom: {
		'en-US': 'Prices extracted from:',
		'es-ES': 'Precios extraídos de:',
	},
	missingPlatform: {
		'en-US': 'ERROR: Platform don\'t found!!',
		'es-ES': 'ERROR: Plataforma no encontrada!!',
	},
	platformInBrowser: {
		'en-US': 'Search in %P on browser',
		'es-ES': 'Buscar en %P en el buscador',
	},
	errorScrapping: {
		'en-US': 'No products could be found in:',
		'es-ES': 'No se pudieron encontrar productos en:',
	},
	notSuggest: {
		'en-US': 'Please suggest someting :tired_face:',
		'es-ES': 'Por favor, sugiere algo :tired_face:',
	},
	linksNotAllowed: {
		'en-US': 'Links aren\'t allowed :/',
		'es-ES': 'No esta permitido enviar links :/',
	},
	discordMessageLengthLimit: {
		'en-US': 'Sorry, the links of this product exceeds the limit of characters by discord message.\n\nPlease try again with a lower quantity of results.',
		'es-ES': 'Lo sentimos, los enlaces de este producto exceden el límite de caracteres por mensaje de discord.\n\nPor favor, intente nuevamente con una menor cantidad de resultados.',
	},
};

const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;


module.exports = {
	countryData,
	responsesTexts,
	DISCORD_MESSAGE_LENGTH_LIMIT,
	urlRegex,
};