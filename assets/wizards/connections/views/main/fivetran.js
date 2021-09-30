/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { ActionCard, Button } from '../../../../components/src';

/**
 * External dependencies
 */
import { parse, stringify } from 'qs';
import { get, values, find } from 'lodash';

export const handleFivetranRedirect = (
	response,
	{ wizardApiFetch, startLoading, doneLoading }
) => {
	const params = parse( window.location.search.replace( /^\?/, '' ) );
	// 'id' param will be appended by the redirect from a Fivetran connect card.
	if ( params.id ) {
		startLoading();
		const newConnector = find( values( response.fivetran ), [ 'id', params.id ] );
		const removeIdParamFromURL = () => {
			// Remove the 'id' param.
			params.id = undefined;
			window.location.search = stringify( params );
		};
		if ( newConnector ) {
			if ( newConnector.sync_state === 'paused' ) {
				wizardApiFetch( {
					path: '/newspack/v1/oauth/fivetran?connector_id=' + newConnector.id,
					method: 'POST',
					data: { paused: false },
				} ).then( removeIdParamFromURL );
			} else {
				removeIdParamFromURL();
			}
		}
		doneLoading();
	}
};

const CONNECTORS = [
	{
		service: 'google_analytics',
		label: __( 'Google Analytics', 'newspack' ),
	},
	{
		service: 'mailchimp',
		label: __( 'Mailchimp', 'newspack' ),
	},
	{
		service: 'stripe',
		label: __( 'Stripe', 'newspack' ),
	},
	{
		service: 'double_click_publishers',
		label: __( 'Google Ad Manager', 'newspack' ),
	},
	{
		service: 'facebook_pages',
		label: __( 'Facebook Pages', 'newspack' ),
	},
];

const FivetranConnection = ( { setError } ) => {
	const [ connections, setConnections ] = useState();
	const [ inFlight, setInFlight ] = useState( false );

	const handleError = err => {
		if ( err.message ) {
			setError( err.message );
		}
		setInFlight( false );
	};

	useEffect( () => {
		setInFlight( true );
		apiFetch( { path: '/newspack/v1/oauth/fivetran' } )
			.then( res => {
				setConnections( res );
				setInFlight( false );
			} )
			.catch( handleError );
	}, [] );

	const createConnection = ( { service } ) => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack/v1/oauth/fivetran/${ service }`,
			method: 'POST',
			data: {
				service,
			},
		} )
			.then( ( { url } ) => ( window.location = url ) )
			.catch( handleError );
	};

	return (
		<div>
			<h1>{ __( 'Fivetran', 'newspack' ) }</h1>
			{ CONNECTORS.map( item => {
				const setupState = get( connections, [ item.service, 'setup_state' ] );
				const syncState = get( connections, [ item.service, 'sync_state' ] );
				const status = {
					label: setupState ? `${ setupState }, ${ syncState }` : '-',
					isConnected: setupState === 'connected',
				};
				return (
					<div key={ item.service }>
						<ActionCard
							title={ item.label }
							description={ `${ __( 'Status:', 'newspack' ) } ${ status.label }` }
							actionText={
								<Button disabled={ inFlight } onClick={ () => createConnection( item ) } isLink>
									{ status.isConnected
										? __( 'Re-connect', 'newspack' )
										: __( 'Connect', 'newspack' ) }
								</Button>
							}
							checkbox={ status.isConnected ? 'checked' : 'unchecked' }
							isMedium
						/>
					</div>
				);
			} ) }
		</div>
	);
};

export default FivetranConnection;
