function truncateText(text, max) {
	return text.substr(0, max - 1).trim() + (text.length > max ? '...' : '');
}

module.exports = truncateText;