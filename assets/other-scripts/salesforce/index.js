/* globals newspack_salesforce_data */

/**
 * WordPress imports.
 */
const { __ } = wp.i18n;

( function () {
	const statusMarker = document.getElementById( 'newspack-salesforce-sync-status' );
	const statusMarkerLabel = statusMarker.querySelector( 'span' );
	const {
		base_url: baseUrl,
		order_id: orderId,
		salesforce_url: salesforceUrl,
	} = newspack_salesforce_data;

	if ( statusMarker ) {
		fetch( `${ baseUrl }newspack/v1/salesforce/order?orderId=${ orderId }` )
			.then( response => response.json() )
			.then( opportunityId => {
				if ( opportunityId ) {
					const anchor = document.createElement( 'a' );
					statusMarker.classList.add( 'status-completed' );
					anchor.href = `${ salesforceUrl }/lightning/r/Opportunity/${ opportunityId }/view`;
					anchor.setAttribute( 'target', '_blank' );
					anchor.setAttribute( 'rel', 'noopener noreferrer' );
					anchor.textContent = __( 'Synced', 'newspack' );
					statusMarkerLabel.textContent = '';
					statusMarkerLabel.appendChild( anchor );
				} else {
					statusMarker.classList.add( 'status-failed' );
					statusMarkerLabel.textContent = __( 'Not synced', 'newspack' );
				}
			} )
			.catch( () => {
				statusMarker.classList.add( 'status-failed' );
				statusMarkerLabel.textContent = __( 'Error fetching status', 'newspack' );
			} );
	}
} )();
