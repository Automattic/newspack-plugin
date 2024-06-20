/**
 * Settings Wizard: Connections > Webhooks > Endpoint Actions Modals
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { CheckboxControl as WpCheckboxControl, Icon, TextControl } from '@wordpress/components';

/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import { API_NAMESPACE } from './constants';
import { useWizardApiFetch } from '../../../../../hooks/use-wizard-api-fetch';
import { Card, Button, Notice, Modal, Grid } from '../../../../../../components/src';
import { getDisplayUrl, getEndpointLabel, getRequestStatusIcon, hasEndpointErrors } from './utils';

const ConfirmationModal = ( {
	disabled,
	onConfirm,
	onClose,
	title,
	description,
}: {
	disabled?: boolean;
	onConfirm?: () => void;
	onClose: () => void;
	title: string;
	description: string;
} ) => {
	return (
		<Modal title={ title } onRequestClose={ onClose }>
			<p>{ description }</p>
			<Card buttonsCard noBorder className="justify-end">
				<Button variant="secondary" onClick={ onClose } disabled={ disabled }>
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button variant="primary" onClick={ onConfirm } disabled={ disabled }>
					{ __( 'Confirm', 'newspack-plugin' ) }
				</Button>
			</Card>
		</Modal>
	);
};

/**
 * Checkbox control props override.
 *
 * @param param WP CheckboxControl Component props.
 * @return      JSX.Element
 */
const CheckboxControl: React.FC< WpCheckboxControlPropsOverride< typeof WpCheckboxControl > > = ( {
	...props
} ) => {
	return <WpCheckboxControl { ...props } />;
};

const EndpointActionsModals = ( {
	endpoint,
	actions,
	action = null,
	setAction,
	setEndpoints,
}: {
	endpoint: Endpoint;
	actions: string[];
	action: WebhookActions;
	setAction: ( action: WebhookActions, id: number | string ) => void;
	setEndpoints: ( endpoints: Endpoint[] ) => void;
} ) => {
	const [ editing, setEditing ] = useState< Endpoint >( endpoint );

	const { wizardApiFetch, isFetching: inFlight, errorMessage } = useWizardApiFetch( API_NAMESPACE );

	const {
		wizardApiFetch: testWizardApiFetch,
		errorMessage: testError,
		resetError: resetTestError,
	} = useWizardApiFetch( `${ API_NAMESPACE }/tests` );

	const ENDPOINTS_CACHE_KEY = { '/newspack/v1/webhooks/endpoints': 'GET' };

	const onSuccess = ( endpointId: string | number, response: Endpoint[] ) => {
		setEndpoints( response );
		setAction( null, endpointId );
	};

	// API
	function toggleEndpoint( endpointToToggle: Endpoint ) {
		wizardApiFetch< Endpoint[] >(
			{
				path: `/newspack/v1/webhooks/endpoints/${ endpointToToggle.id }`,
				method: 'POST',
				data: { disabled: ! endpointToToggle.disabled },
				updateCacheKey: ENDPOINTS_CACHE_KEY,
			},
			{
				onSuccess: endpoints => onSuccess( endpointToToggle.id, endpoints ),
			}
		);
	}
	function deleteEndpoint( endpointToDelete: Endpoint ) {
		wizardApiFetch< Endpoint[] >(
			{
				path: `/newspack/v1/webhooks/endpoints/${ endpointToDelete.id }`,
				method: 'DELETE',
				updateCacheKey: ENDPOINTS_CACHE_KEY,
			},
			{
				onSuccess: endpoints => onSuccess( endpointToDelete.id, endpoints ),
			}
		);
	}
	function upsertEndpoint( endpointToUpsert: Endpoint ) {
		wizardApiFetch< Endpoint[] >(
			{
				path: `/newspack/v1/webhooks/endpoints/${ endpointToUpsert.id || '' }`,
				method: 'POST',
				data: endpointToUpsert,
				updateCacheKey: ENDPOINTS_CACHE_KEY,
			},
			{
				onSuccess: endpoints => onSuccess( endpointToUpsert.id, endpoints ),
			}
		);
	}

	// Test request
	const [ testResponse, setTestResponse ] = useState< {
		success?: boolean;
		code?: number;
		message?: string;
	} >( {} );
	function sendTestRequest( url: string | undefined, bearer_token: string | undefined ) {
		testWizardApiFetch< { success: boolean; code: number; message: string } >(
			{
				path: '/newspack/v1/webhooks/endpoints/test',
				method: 'POST',
				data: { url, bearer_token },
			},
			{
				onStart() {
					resetTestError();
					setTestResponse( {} );
				},
				onSuccess( res ) {
					setTestResponse( res );
				},
			}
		);
	}

	return (
		<Fragment>
			{ action === 'delete' && (
				<ConfirmationModal
					title={ __( 'Remove Endpoint', 'newspack-plugin' ) }
					description={ sprintf(
						/* translators: %s: endpoint title */
						__( 'Are you sure you want to remove the endpoint %s?', 'newspack-plugin' ),
						`"${ getDisplayUrl( endpoint.url ) }"`
					) }
					onClose={ () => setAction( null, endpoint.id ) }
					onConfirm={ () => deleteEndpoint( endpoint ) }
					disabled={ inFlight }
				/>
			) }
			{ action === 'toggle' && (
				<ConfirmationModal
					title={
						endpoint.disabled
							? __( 'Enable Endpoint', 'newspack-plugin' )
							: __( 'Disable Endpoint', 'newspack-plugin' )
					}
					description={
						endpoint.disabled
							? sprintf(
									/* translators: %s: endpoint title */
									__( 'Are you sure you want to enable the endpoint %s?', 'newspack-plugin' ),
									`"${ getDisplayUrl( endpoint.url ) }"`
							  )
							: sprintf(
									/* translators: %s: endpoint title */
									__( 'Are you sure you want to disable the endpoint %s?', 'newspack-plugin' ),
									`"${ getDisplayUrl( endpoint.url ) }"`
							  )
					}
					onClose={ () => setAction( null, endpoint.id ) }
					onConfirm={ () => toggleEndpoint( endpoint ) }
					disabled={ inFlight }
				/>
			) }
			{ action === 'view' && (
				<Modal
					title={ __( 'Latest Requests', 'newspack-plugin' ) }
					onRequestClose={ () => setAction( null, endpoint.id ) }
				>
					<p>
						{ sprintf(
							// translators: %s is the endpoint title (shortened URL).
							__( 'Most recent requests for %s', 'newspack-plugin' ),
							getEndpointLabel( endpoint )
						) }
					</p>
					{ endpoint.requests.length > 0 ? (
						<table
							className={ `newspack-webhooks__requests ${
								hasEndpointErrors( endpoint ) ? 'has-error' : ''
							}` }
						>
							<tr>
								<th />
								<th colSpan={ 2 }>{ __( 'Action', 'newspack-plugin' ) }</th>
								{ hasEndpointErrors( endpoint ) && (
									<th colSpan={ 2 }>{ __( 'Error', 'newspack-plugin' ) }</th>
								) }
							</tr>
							{ endpoint.requests.map( request => (
								<tr key={ request.id }>
									<td className={ `status status--${ request.status }` }>
										<Icon icon={ getRequestStatusIcon( request.status ) } />
									</td>
									<td className="action-name">{ request.action_name }</td>
									<td className="scheduled">
										{ 'pending' === request.status
											? sprintf(
													// translators: %s is a human-readable time difference.
													__( 'sending in %s', 'newspack-plugin' ),
													moment( parseInt( request.scheduled ) * 1000 ).fromNow( true )
											  )
											: sprintf(
													// translators: %s is a human-readable time difference.
													__( 'processed %s', 'newspack-plugin' ),
													moment( parseInt( request.scheduled ) * 1000 ).fromNow()
											  ) }
									</td>
									{ hasEndpointErrors( endpoint ) && (
										<Fragment>
											<td className="error">
												{ request.errors && request.errors.length > 0
													? request.errors[ request.errors.length - 1 ]
													: '--' }
											</td>
											<td>
												<span className="error-count">
													{ sprintf(
														// translators: %s is the number of errors.
														__( 'Attempt #%s', 'newspack-plugin' ),
														request.errors.length
													) }
												</span>
											</td>
										</Fragment>
									) }
								</tr>
							) ) }
						</table>
					) : (
						<Notice
							noticeText={ __(
								"This endpoint hasn't received any requests yet.",
								'newspack-plugin'
							) }
						/>
					) }
				</Modal>
			) }
			{ [ 'edit', 'new' ].includes( action ?? '' ) && (
				<Modal
					title={ __( 'Webhook Endpoint', 'newspack-plugin' ) }
					onRequestClose={ () => {
						setAction( null, endpoint.id );
					} }
				>
					{ errorMessage && <Notice isError noticeText={ errorMessage } /> }
					{ true === editing.disabled && (
						<Notice
							noticeText={ __( 'This webhook endpoint is currently disabled.', 'newspack-plugin' ) }
							className="mt0"
						/>
					) }
					{ editing.disabled && editing.disabled_error && (
						<Notice
							isError
							noticeText={ __( 'Request Error: ', 'newspack-plugin' ) + editing.disabled_error }
							className="mt0"
						/>
					) }
					{ testError && (
						<Notice
							isError
							noticeText={ __( 'Test Error: ', 'newspack-plugin' ) + testError }
							className="mt0"
						/>
					) }
					<Grid columns={ 1 } gutter={ 16 } className="mt0">
						<TextControl
							label={ __( 'URL', 'newspack-plugin' ) }
							help={ __(
								"The URL to send requests to. It's required for the URL to be under a valid TLS/SSL certificate. You can use the test button below to verify the endpoint response.",
								'newspack-plugin'
							) }
							className="code"
							value={ editing.url }
							onChange={ ( value: string ) => setEditing( { ...editing, url: value } ) }
							disabled={ inFlight }
						/>
						<TextControl
							label={ __( 'Authentication token (optional)', 'newspack-plugin' ) }
							help={ __(
								'If your endpoint requires a token authentication, enter it here. It will be sent as a Bearer token in the Authorization header.',
								'newspack-plugin'
							) }
							value={ editing.bearer_token ?? '' }
							onChange={ ( value: string ) => setEditing( { ...editing, bearer_token: value } ) }
							disabled={ inFlight }
						/>
						<Card buttonsCard noBorder className="justify-end">
							{ testResponse && (
								<div
									className={ `newspack-webhooks__test-response status--${
										testResponse.success ? 'success' : 'error'
									}` }
								>
									<span className="message">{ testResponse.message }</span>
									<span className="code">{ testResponse.code }</span>
								</div>
							) }
							<Button
								variant="secondary"
								disabled={ inFlight || ! editing.url }
								onClick={ () => sendTestRequest( editing.url, editing.bearer_token ) }
							>
								{ __( 'Send a test request', 'newspack-plugin' ) }
							</Button>
						</Card>
					</Grid>
					<hr />
					<TextControl
						label={ __( 'Label (optional)', 'newspack-plugin' ) }
						help={ __(
							'A label to help you identify this endpoint. It will not be sent to the endpoint.',
							'newspack-plugin'
						) }
						value={ editing.label }
						onChange={ ( value: string ) => setEditing( { ...editing, label: value } ) }
						disabled={ inFlight }
					/>
					<Grid columns={ 1 } gutter={ 16 }>
						<h3>{ __( 'Actions', 'newspack-plugin' ) }</h3>
						<CheckboxControl
							checked={ editing.global }
							onChange={ ( value: boolean ) => setEditing( { ...editing, global: value } ) }
							label={ __( 'Global', 'newspack-plugin' ) }
							help={ __(
								'Leave this checked if you want this endpoint to receive data from all actions.',
								'newspack-plugin'
							) }
							disabled={ inFlight }
						/>
						{ actions.length > 0 && (
							<Fragment>
								<p>
									{ __(
										'If this endpoint is not global, select which actions should trigger this endpoint:',
										'newspack-plugin'
									) }
								</p>
								<Grid columns={ 2 } gutter={ 16 }>
									{ actions.map( ( actionKey, i ) => (
										<CheckboxControl
											key={ i }
											disabled={ editing.global || inFlight }
											label={ actionKey }
											checked={
												( editing.actions && editing.actions.includes( actionKey ) ) || false
											}
											indeterminate={ editing.global }
											onChange={ () => {
												const currentActions = editing.actions || [];
												if ( currentActions.includes( actionKey ) ) {
													currentActions.splice( currentActions.indexOf( actionKey ), 1 );
												} else {
													currentActions.push( actionKey );
												}
												setEditing( { ...editing, actions: currentActions } );
											} }
										/>
									) ) }
								</Grid>
							</Fragment>
						) }
						<Card buttonsCard noBorder className="justify-end">
							<Button
								isPrimary
								onClick={ () => {
									if ( null !== editing && 'url' in editing ) {
										upsertEndpoint( editing );
									}
								} }
								disabled={ inFlight || null === editing }
							>
								{ __( 'Save', 'newspack-plugin' ) }
							</Button>
						</Card>
					</Grid>
				</Modal>
			) }
		</Fragment>
	);
};

export default EndpointActionsModals;