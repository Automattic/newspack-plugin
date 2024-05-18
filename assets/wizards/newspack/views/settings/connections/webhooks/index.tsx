/**
 * Settings Wizard: Connections > Webhooks.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Card, Button, Notice, SectionHeader } from '../../../../../../components/src';
import EndpointActionsCard from './endpoint-actions-card';
import EndpointActionsModals from './endpoint-actions-modals';
import { useWizardApiFetch } from '../../../../../hooks/use-wizard-api-fetch';
import useWizardError from '../../../../../hooks/use-wizard-error';

const defaultEndpoint: Endpoint = {
	url: '',
	label: '',
	requests: [],
	disabled: false,
	disabled_error: false,
	id: 0,
	system: '',
	global: true,
	actions: [],
	bearer_token: '',
};

const Webhooks = () => {
	const { wizardApiFetch, isFetching: inFlight } = useWizardApiFetch();

	const [ action, setAction ] = useState< Actions >( null );
	const [ actions, setActions ] = useState< string[] >( [] );
	const [ endpoints, setEndpoints ] = useState< Endpoint[] >( [] );
	const [ selectedEndpoint, setSelectedEndpoint ] = useState< Endpoint | null >( null );

	useEffect( () => {
		fetchActions();
		fetchEndpoints();
	}, [] );

	/**
	 * Component state for error handling.
	 */
	const { error, setError, isError } = useWizardError(
		'newspack/settings',
		'connections/webhooks'
	);

	function fetchActions() {
		wizardApiFetch< never[] >(
			{
				path: '/newspack/v1/data-events/actions',
			},
			{
				onSuccess: newActions => setActions( newActions ),
				onError: e => setError( e ),
			}
		);
	}

	function fetchEndpoints() {
		wizardApiFetch< Endpoint[] >(
			{ path: '/newspack/v1/webhooks/endpoints' },
			{
				onSuccess: newEndpoints => setEndpoints( newEndpoints ),
				onError: e => setError( e ),
			}
		);
	}

	function setActionHandler( newAction: Actions, id?: number | string ) {
		setAction( newAction );
		if ( newAction === null ) {
			setSelectedEndpoint( null );
		} else if ( newAction === 'new' ) {
			setSelectedEndpoint( { ...defaultEndpoint } );
		} else if ( [ 'edit', 'delete', 'view' ].includes( newAction ) ) {
			setSelectedEndpoint( endpoints.find( endpoint => endpoint.id === id ) || null );
		}
	}

	return (
		<Card noBorder>
			<div className="flex justify-between items-end">
				<SectionHeader
					title={ __( 'Webhook Endpoints', 'newspack-plugin' ) }
					description={ __(
						'Register webhook endpoints to integrate reader activity data to third-party services or private APIs',
						'newspack-plugin'
					) }
					noMargin
				/>
				<Button variant="primary" onClick={ () => setActionHandler( 'new' ) } disabled={ inFlight }>
					{ inFlight
						? __( 'Loading…', 'newspack-plugin' )
						: __( 'Add New Endpoint', 'newspack-plugin' ) }
				</Button>
			</div>
			{ isError && <Notice isError noticeText={ error } /> }
			{ endpoints.length > 0 && (
				<>
					{ endpoints.map( endpoint => (
						<EndpointActionsCard
							key={ endpoint.id }
							endpoint={ endpoint }
							setAction={ setActionHandler }
						/>
					) ) }
				</>
			) }
			{ selectedEndpoint && (
				<EndpointActionsModals
					actions={ actions }
					action={ action }
					endpoint={ selectedEndpoint }
					setAction={ setActionHandler }
					setEndpoints={ setEndpoints }
				/>
			) }
		</Card>
	);
};

export default Webhooks;
