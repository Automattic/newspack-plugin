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
import { ActionCard } from '@components';

/**
 * External dependencies
 */
import classnames from 'classnames';
import get from 'lodash/get';

const CONNECTORS = [
	{
		service: 'stripe',
		label: __( 'Stripe', 'newspack-plugin' ),
	},
] as const;

type FivetranConnector = typeof CONNECTORS;

const getConnectionStatus = (
	item: FivetranConnector[ number ],
	connections: FivetranConnector | undefined
) => {
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
				'newspack-plugin'
			) }`;
		}
	} else if ( hasConnections ) {
		label = __( 'Not connected', 'newspack-plugin' );
	}
	return {
		label,
		isConnected: setupState === 'connected',
		isPending,
	};
};

const Fivetran = ( { setError }: { setError: SetErrorCallback } ) => {
	const [ connections, setConnections ] = useState< typeof CONNECTORS >();
	const [ inFlight, setInFlight ] = useState( false );
	const [ hasAcceptedTOS, setHasAcceptedTOS ] = useState< boolean | null >( null );

	const handleError = ( err: Error ) =>
		setError( err.message || __( 'Something went wrong.', 'newspack-plugin' ) );

	const hasConnections = connections !== undefined;
	const isDisabled = inFlight || ! hasConnections || ! hasAcceptedTOS;

	useEffect( () => {
		setInFlight( true );
		apiFetch< { connections_statuses: FivetranConnector; has_accepted_tos: boolean | null } >( {
			path: '/newspack/v1/oauth/fivetran',
		} )
			.then( response => {
				setConnections( response.connections_statuses );
				setHasAcceptedTOS( response.has_accepted_tos );
			} )
			.catch( handleError )
			.finally( () => setInFlight( false ) );
	}, [] );

	const createConnection = ( { service }: { service: string } ) => {
		setInFlight( true );
		apiFetch< { url: string & Location } >( {
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
				{ __( 'In order to use the this features, you must read and accept', 'newspack-plugin' ) }{ ' ' }
				<a href="https://newspack.com/terms-of-service/">
					{ __( 'Newspack Terms of Service', 'newspack-plugin' ) }
				</a>
				:
			</div>
			<CheckboxControl
				className={ classnames( 'mt1', { 'o-50': hasAcceptedTOS === null } ) }
				checked={ ! hasAcceptedTOS }
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
				label={ __( "I've read and accept Newspack Terms of Service", 'newspack-plugin' ) }
			/>
			{ CONNECTORS.map( item => {
				const status = getConnectionStatus( item, connections );
				return (
					<ActionCard
						key={ item.service }
						title={ item.label }
						description={ `${ __( 'Status:', 'newspack-plugin' ) } ${ status.label }` }
						isPending={ status.isPending }
						actionText={
							<Button disabled={ isDisabled } onClick={ () => createConnection( item ) } isLink>
								{ status.isConnected
									? __( 'Re-connect', 'newspack-plugin' )
									: __( 'Connect', 'newspack-plugin' ) }
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

export default Fivetran;
