export const countryData = {
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
}

export const DISCORD_MESSAGE_LENGTH_LIMIT = 2000