/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button, CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ActionCard } from '../../../../components/src';

/**
 * External dependencies
 */
import classnames from 'classnames';
import get from 'lodash/get';

const CONNECTORS = [
	{
		service: 'stripe',
		label: __( 'Stripe', 'newspack' ),
	},
];

const getConnectionStatus = ( item, connections ) => {
	const hasConnections = connections !== undefined;
	const setupState = get( connections, [ item.service, 'setup_state' ] );
	const syncState = get( connections, [ item.service, 'sync_state' ] );
	const schemaStatus = get( connections, [ item.service, 'schema_status' ] );
	const isPending = ( schemaStatus && 'ready' !== schemaStatus ) || 'paused' === syncState;
	let label = '-';
	if ( setupState ) {
		if ( 'ready' === schemaStatus ) {
			label = `${ setupState }, ${ syncState }`;
		} else if ( isPending ) {
			label = `${ setupState }, ${ syncState }. ${ __(
				'Sync is in progress – please check back in a while.',
				'newspack'
			) }`;
		}
	} else if ( hasConnections ) {
		label = __( 'Not connected', 'newspack' );
	}
	return {
		label,
		isConnected: setupState === 'connected',
		isPending,
	};
};

const FivetranConnection = ( { setError } ) => {
	const [ connections, setConnections ] = useState();
	const [ inFlight, setInFlight ] = useState( false );
	const [ hasAcceptedTOS, setHasAcceptedTOS ] = useState( null );

	const handleError = err => setError( err.message || __( 'Something went wrong.', 'newspack' ) );

	const hasConnections = connections !== undefined;
	const isDisabled = inFlight || ! hasConnections || ! hasAcceptedTOS;

	useEffect( () => {
		setInFlight( true );
		apiFetch( { path: '/newspack/v1/oauth/fivetran' } )
			.then( response => {
				setConnections( response.connections_statuses );
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
				<a href="https://newspack.com/terms-of-service/">
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
						isPending={ status.isPending }
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
