/**
 * Get the list of available services from author data.
 *
 * @param {Object} author Author data.
 * @return {Array} Array of service key strings.
 */
export function getAvailableServices( author ) {
	const services = [];

	if ( author?.social ) {
		Object.entries( author.social ).forEach( ( [ service, data ] ) => {
			if ( data?.url ) {
				services.push( service );
			}
		} );
	}

	if ( author?.email ) {
		services.push( 'email' );
	}

	if ( author?.newspack_phone_number ) {
		services.push( 'phone' );
	}

	return services;
}

/**
 * Build InnerBlocks template from available services.
 *
 * @param {Array} services List of service keys.
 * @return {Array} Block template array.
 */
export function buildTemplate( services ) {
	return services.map( service => [ 'newspack/author-social-link', { service } ] );
}
