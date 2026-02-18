/**
 * Get the URL for a service from author data.
 *
 * @param {Object} author  Author data object.
 * @param {string} service Service key.
 * @return {string|null} URL or null.
 */
export function getServiceUrl( author, service ) {
	if ( ! author || ! service ) {
		return null;
	}

	if ( service === 'email' ) {
		const email = author.email;
		if ( ! email ) {
			return null;
		}
		if ( typeof email === 'object' ) {
			return email.url || null;
		}
		return `mailto:${ email }`;
	}

	if ( service === 'phone' ) {
		const phone = author.newspack_phone_number;
		if ( ! phone ) {
			return null;
		}
		if ( typeof phone === 'object' ) {
			return phone.url || null;
		}
		return `tel:${ phone }`;
	}

	// Social services.
	const socialData = author.social?.[ service ];
	if ( ! socialData?.url ) {
		return null;
	}
	return socialData.url;
}

/**
 * Get the author data object for a service (for SVG lookup).
 *
 * @param {Object} author  Author data object.
 * @param {string} service Service key.
 * @return {Object|null} Service data with optional svg property.
 */
export function getServiceData( author, service ) {
	if ( ! author || ! service ) {
		return null;
	}

	if ( service === 'email' ) {
		const email = author.email;
		return typeof email === 'object' ? email : null;
	}

	if ( service === 'phone' ) {
		const phone = author.newspack_phone_number;
		return typeof phone === 'object' ? phone : null;
	}

	return author.social?.[ service ] || null;
}
