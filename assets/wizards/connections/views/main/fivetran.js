/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { CheckboxControl, ActionCard, Button } from '../../../../components/src';

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
	const [ hasAcceptedTOS, setHasAcceptedTOS ] = useState( null );

	const hasFetched = connections !== undefined;

	const handleError = err => setError( err.message || __( 'Something went wrong.', 'newspack' ) );

	useEffect( () => {
		setInFlight( true );
		apiFetch( { path: '/newspack/v1/oauth/fivetran' } )
			.then( response => {
				setConnections( response.connections_stauses );
				setHasAcceptedTOS( response.has_accepted_tos );
			} )
			.catch( handleError )
			.finally( () => setInFlight( false ) );
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
		<>
			<div>
				{ __( 'In order to use the this features, you must read and accept', 'newspack' ) }{ ' ' }
				<a href="https://newspack.pub/terms-of-service/">
					{ __( 'Newspack Terms of Service', 'newspack' ) }
				</a>
				:
			</div>
			<CheckboxControl
				className={ classnames( 'mt1', { 'o-50': hasAcceptedTOS === null } ) }
				checked={ hasAcceptedTOS }
				disabled={ hasAcceptedTOS === null }
				onChange={ has_accepted => {
					apiFetch( {
						path: `/newspack/v1/oauth/fivetran-tos`,
						method: 'POST',
						data: {
							has_accepted,
						},
					} );
					setHasAcceptedTOS( has_accepted );
				} }
				label={ __( "I've read and accept Newspack Terms of Service", 'newspack' ) }
			/>
			{ CONNECTORS.map( item => {
				const setupState = get( connections, [ item.service, 'setup_state' ] );
				const syncState = get( connections, [ item.service, 'sync_state' ] );
				const status = {
					// eslint-disable-next-line no-nested-ternary
					label: setupState
						? `${ setupState }, ${ syncState }`
						: hasFetched
						? __( 'Not connected', 'newspack' )
						: '-',
					isConnected: setupState === 'connected',
				};
				return (
					<ActionCard
						key={ item.service }
						title={ item.label }
						description={ `${ __( 'Status:', 'newspack' ) } ${ status.label }` }
						actionText={
							<Button
								disabled={ inFlight || ! hasFetched || ! hasAcceptedTOS }
								onClick={ () => createConnection( item ) }
								isLink
							>
								{ status.isConnected
									? __( 'Re-connect', 'newspack' )
									: __( 'Connect', 'newspack' ) }
							</Button>
						}
						checkbox={ status.isConnected ? 'checked' : 'unchecked' }
						isMedium
					/>
				);
			} ) }
		</>
	);
};

export default FivetranConnection;
