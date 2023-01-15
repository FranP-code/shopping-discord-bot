const { responsesTexts } = require('../utils/constants');

function generateLocalizedResponses(userLanguage) {
	const responsesEntries = Object.entries(responsesTexts);
	const localizatedResponses = {};
	responsesEntries.forEach(([responseName, responseTexts]) => {
		localizatedResponses[responseName] = Object.entries(responseTexts).find(responseText => responseText[0] === userLanguage)[1];
	});
	return localizatedResponses;
}

module.exports = generateLocalizedResponses;