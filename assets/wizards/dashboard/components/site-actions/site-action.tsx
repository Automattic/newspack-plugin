/**
 * Dependencies
 */
// WordPress
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

const defaultStatusLabels = {
	idle: '',
	error: __( 'Disconnected', 'newspack-plugin' ),
	success: __( 'Connected', 'newspack-plugin' ),
	pending: __( 'Fetching...', 'newspack-plugin' ),
};

/**
 * Newspack - Dashboard, Site Status
 *
 * Site status component displays connections to various 3rd party vendors i.e. Google Analytics
 */
const SiteAction = ( {
	label = '',
	canConnect = true,
	statusLabels,
	endpoint,
	then,
}: {
	label: string;
	canConnect?: boolean;
	statusLabels?: { [ k in Statuses ]?: string };
	endpoint: string;
	then: ( args?: any ) => boolean;
} ) => {
	const [ requestStatus, setRequestStatus ] = useState< Statuses >( 'idle' );
	const parsedStatusLabels = { ...defaultStatusLabels, ...statusLabels };
	useEffect( () => {
		if ( ! canConnect ) {
			setRequestStatus( 'error' );
			return;
		}
		setRequestStatus( 'pending' );
		apiFetch( {
			path: endpoint,
		} )
			.then( data => {
				setRequestStatus( then( data ) ? 'success' : 'error' );
			} )
			.catch( () => {
				then( false );
				setRequestStatus( 'error' );
			} );
	}, [] );
	const classes = `newspack-dashboard__site-action newspack-dashboard__site-action-${ requestStatus }`;
	return (
		<div className={ classes }>
			{ label }: <span>{ parsedStatusLabels[ requestStatus ] }</span>
		</div>
	);
};

export default SiteAction;
