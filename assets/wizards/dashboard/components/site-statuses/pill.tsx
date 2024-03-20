/**
 * Dependencies
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useEffect } from 'react';

type Statuses = 'success' | 'error' | 'pending' | 'idle';

const defaultStatusLabels = {
	success: __( 'Connected', 'newspack-plugin' ),
	error: __( 'Disconnected', 'newspack-plugin' ),
	pending: __( 'Fetching...', 'newspack-plugin' ),
	idle: '',
};

/**
 * Newspack - Dashboard, Site Status
 *
 * Site status component displays connections to various 3rd party vendors i.e. Google Analytics
 */
const Pill = ( {
	label = '',
	statusLabels,
	endpoint,
	then,
}: {
	label: string;
	statusLabels?: { [ k in Statuses ]?: string };
	endpoint: string;
	then: ( args?: any ) => boolean;
} ) => {
	const [ requestStatus, setRequestStatus ] = useState< Statuses >(
		'idle'
	);
	const parsedStatusLabels = { ...defaultStatusLabels, ...statusLabels, };
	useEffect( () => {
		setRequestStatus( 'pending' );
		apiFetch( {
			path: endpoint,
		} )
			.then( data => {
				setRequestStatus( ! then( data ) ? 'success' : 'error' );
			} )
			.catch( () => {
				then( false );
				setRequestStatus( 'error' );
			} );
	}, [] );
	const classes = `newspack-dashboard__pill newspack-dashboard__pill-${ requestStatus }`;
	return (
		<div className={ classes }>
			{ label }: <span>{ parsedStatusLabels[requestStatus] }</span>
		</div>
	);
};

export default Pill;
