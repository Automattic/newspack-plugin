/**
 * Settings > Connections > Webhooks > Endpoint Actions Modals
 */

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { CheckboxControl as WpCheckboxControl, Icon, TextControl } from '@wordpress/components';

/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import { useWizardApiFetch } from '../../../../../hooks/use-wizard-api-fetch';
import { Card, Button, Notice, Modal, Grid } from '../../../../../../components/src';
import useWizardDataPropError from '../../../../../hooks/use-wizard-data-prop-error';
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
				<Button isSecondary onClick={ onClose } disabled={ disabled }>
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button isPrimary onClick={ onConfirm } disabled={ disabled }>
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
	action: Actions;
	setAction: ( action: Actions, id: number | string ) => void;
	setEndpoints: ( endpoints: Endpoint[] ) => void;
} ) => {
	const [ editing, setEditing ] = useState< Endpoint >( endpoint );

	const { wizardApiFetch, isLoading: inFlight } = useWizardApiFetch();

	const { error, setError } = useWizardDataPropError(
		'newspack/settings',
		`connections/webhooks/${ endpoint.id }`
	);
	const {
		error: testError,
		setError: setTestError,
		resetError: resetTestError,
	} = useWizardDataPropError( 'newspack/settings', `connections/webhooks/tests/${ endpoint.id }` );

	// API
	const toggleEndpoint = ( endpointToToggle: Endpoint ) => {
		wizardApiFetch< Endpoint[] >(
			{
				path: `/newspack/v1/webhooks/endpoints/${ endpointToToggle.id }`,
				method: 'POST',
				data: { disabled: ! endpointToToggle.disabled },
			},
			{
				onSuccess: endpoints => setEndpoints( endpoints ),
				onError: e => setError( e ),
				onFinally: () => setAction( null, endpointToToggle.id ),
			}
		);
	};
	const deleteEndpoint = ( endpointToDelete: Endpoint ) => {
		wizardApiFetch< Endpoint[] >(
			{
				path: `/newspack/v1/webhooks/endpoints/${ endpointToDelete.id }`,
				method: 'DELETE',
			},
			{
				onSuccess: endpoints => setEndpoints( endpoints ),
				onError: e => setError( e ),
				onFinally: () => setAction( null, endpointToDelete.id ),
			}
		);
	};
	const upsertEndpoint = ( endpointToUpsert: Endpoint ) => {
		wizardApiFetch< Endpoint[] >(
			{
				path: `/newspack/v1/webhooks/endpoints/${ endpointToUpsert.id || '' }`,
				method: 'POST',
				data: endpointToUpsert,
			},
			{
				onSuccess( res ) {
					setEndpoints( res );
					setAction( null, endpointToUpsert.id );
				},
				onError( e ) {
					setError( e );
				},
			}
		);
	};

	// Test request
	const [ testResponse, setTestResponse ] = useState<
		{ success: boolean; code: number; message: string } | false
	>( false );
	const sendTestRequest = ( url: string | undefined, bearer_token: string | undefined ) => {
		wizardApiFetch< { success: boolean; code: number; message: string } >(
			{
				path: '/newspack/v1/webhooks/endpoints/test',
				method: 'POST',
				data: { url, bearer_token },
			},
			{
				onStart() {
					resetTestError();
					setTestResponse( false );
				},
				onSuccess( res ) {
					setTestResponse( res );
				},
				onError( e ) {
					setTestError( e );
				},
			}
		);
	};

	return (
		<>
			{ /* Modals */ }
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
										<>
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
										</>
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
					{ error && <Notice isError noticeText={ error } /> }
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
							noticeText={ __( 'Test Error: ', 'newspack-plugin' ) + testError.message }
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
								isSecondary
								onClick={ () => sendTestRequest( editing.url, editing.bearer_token ) }
								disabled={ inFlight || ! editing.url }
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
							<>
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
							</>
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
		</>
	);
};

export default EndpointActionsModals;
