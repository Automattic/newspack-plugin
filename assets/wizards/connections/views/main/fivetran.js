/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { CheckboxControl, ActionCard, Button, Wizard } from '../../../../components/src';

/**
 * External dependencies
 */
import { parse, stringify } from 'qs';
import { get, values, find } from 'lodash';

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

const getConnectionStatus = ( item, connections ) => {
	const hasConnections = connections !== undefined;
	const setupState = get( connections, [ item.service, 'setup_state' ] );
	const syncState = get( connections, [ item.service, 'sync_state' ] );
	const schemaStatus = get( connections, [ item.service, 'schema_status' ] );
	const isInitialSyncBeforeSetup = 'blocked_on_capture' === schemaStatus;
	let label = '-';
	if ( setupState ) {
		if ( 'ready' === schemaStatus ) {
			label = `${ setupState }, ${ syncState }`;
		} else if ( isInitialSyncBeforeSetup ) {
			label = `${ setupState }, ${ syncState }. ${ __(
				'Initial sync is in progress – please check back in a while for the setup to complete.',
				'newspack'
			) }`;
		}
	} else if ( hasConnections ) {
		label = __( 'Not connected', 'newspack' );
	}
	return {
		label,
		isConnected: setupState === 'connected',
		isInitialSyncBeforeSetup,
	};
};

const FivetranConnection = ( { setError, setIsResolvingAuth, isResolvingAuth } ) => {
	const [ connections, setConnections ] = useState();
	const [ inFlight, setInFlight ] = useState( false );
	const [ hasAcceptedTOS, setHasAcceptedTOS ] = useState( null );

	const { wizardApiFetch } = useDispatch( Wizard.STORE_NAMESPACE );

	const handleError = err => setError( err.message || __( 'Something went wrong.', 'newspack' ) );

	const hasConnections = connections !== undefined;
	const isDisabled = isResolvingAuth || inFlight || ! hasConnections || ! hasAcceptedTOS;

	useEffect( () => {
		const params = parse( window.location.search.replace( /^\?/, '' ) );
		if ( params.id ) {
			// Block UI. The `id` param means the user has landed here after a redirect from Fivetran.
			setIsResolvingAuth( true );
		}
		setInFlight( true );
		apiFetch( { path: '/newspack/v1/oauth/fivetran' } )
			.then( response => {
				setConnections( response.connections_stauses );
				setHasAcceptedTOS( response.has_accepted_tos );

				if ( params.id ) {
					const newConnector = find( values( response.connections_stauses ), [ 'id', params.id ] );
					const removeIdParamFromURLAndReload = () => {
						params.id = undefined;
						window.location.search = stringify( params );
					};
					if ( newConnector && newConnector.sync_state === 'paused' ) {
						// Set up the new connector.
						wizardApiFetch( {
							path: '/newspack/v1/oauth/fivetran?connector_id=' + newConnector.id,
							method: 'POST',
							data: { paused: false, schema_status: 'blocked_on_capture' },
						} ).then( removeIdParamFromURLAndReload );
					}
					removeIdParamFromURLAndReload();
				}
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
				const status = getConnectionStatus( item, connections );
				return (
					<ActionCard
						key={ item.service }
						title={ item.label }
						description={ `${ __( 'Status:', 'newspack' ) } ${ status.label }` }
						isPending={ status.isInitialSyncBeforeSetup }
						actionText={
							<Button disabled={ isDisabled } onClick={ () => createConnection( item ) } isLink>
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
