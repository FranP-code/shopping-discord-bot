require('dotenv').config();

const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
function getRandomElementFromArray(arr) {
	return arr[Math.floor((Math.random() * arr.length))];
}
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
function responses(userLanguage) {
	const responsesEntries = Object.entries(responsesTexts);
	const localizatedResponses = {};
	responsesEntries.forEach(([responseName, responseTexts]) => {
		localizatedResponses[responseName] = Object.entries(responseTexts).find(responseText => responseText[0] === userLanguage)[1];
	});
	return localizatedResponses;
}

module.exports = {
	urlRegex,
	getRandomElementFromArray,
	responses,
};