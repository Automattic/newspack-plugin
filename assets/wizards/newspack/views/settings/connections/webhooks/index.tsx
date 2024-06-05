/**
 * Settings Wizard: Connections > Webhooks.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Card, Button, Notice, SectionHeader } from '../../../../../../components/src';
import EndpointActionsCard from './endpoint-actions-card';
import EndpointActionsModals from './endpoint-actions-modals';
import { useWizardApiFetch } from '../../../../../hooks/use-wizard-api-fetch';

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

function Webhooks() {
	const { wizardApiFetch, isFetching: inFlight } = useWizardApiFetch(
		'/newspack-settings/connections/webhooks'
	);

	const [ action, setAction ] = useState< WebhookActions >( null );
	const [ actions, setActions ] = useState< string[] >( [] );
	const [ endpoints, setEndpoints ] = useState< Endpoint[] | null >( null );
	const [ selectedEndpoint, setSelectedEndpoint ] = useState< Endpoint | null >( null );

	useEffect( () => {
		fetchActions();
		fetchEndpoints();
	}, [] );

	function fetchActions() {
		wizardApiFetch< never[] >(
			{
				path: '/newspack/v1/data-events/actions',
			},
			{
				onSuccess: newActions => setActions( newActions ),
			}
		);
	}

	function fetchEndpoints() {
		wizardApiFetch< Endpoint[] >(
			{ path: '/newspack/v1/webhooks/endpoints' },
			{
				onSuccess: newEndpoints => setEndpoints( newEndpoints ),
			}
		);
	}

	function setActionHandler( newAction: WebhookActions, id?: number | string ) {
		setAction( newAction );
		if ( newAction === null ) {
			setSelectedEndpoint( null );
		} else if ( newAction === 'new' ) {
			setSelectedEndpoint( { ...defaultEndpoint } );
		} else if ( endpoints && [ 'edit', 'delete', 'view' ].includes( newAction ) ) {
			setSelectedEndpoint( endpoints.find( endpoint => endpoint.id === id ) || null );
		}
	}

	return (
		<Card noBorder className="newspack-webhooks">
			<div className="flex justify-between items-end mb4">
				<SectionHeader
					title={ __( 'Webhook Endpoints', 'newspack-plugin' ) }
					heading={ 3 }
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
			{ ! inFlight &&
				( endpoints && endpoints.length > 0 ? (
					<Fragment>
						{ endpoints.map( endpoint => (
							<EndpointActionsCard
								key={ endpoint.id }
								endpoint={ endpoint }
								setAction={ setActionHandler }
							/>
						) ) }
					</Fragment>
				) : (
					<Notice noticeText={ __( 'No endpoints found', 'newspack-plugin' ) } />
				) ) }
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
}

export default Webhooks;
