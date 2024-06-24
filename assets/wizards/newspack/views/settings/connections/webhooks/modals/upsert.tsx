/**
 * Settings Wizard: Connections > Webhooks > Modals > Upsert
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';
import { CheckboxControl as WpCheckboxControl, TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { API_NAMESPACE, ENDPOINTS_CACHE_KEY } from '../constants';
import { useWizardApiFetch } from '../../../../../../hooks/use-wizard-api-fetch';
import { Card, Button, Notice, Modal, Grid } from '../../../../../../../components/src';

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

const Upsert = ( {
	endpoint,
	actions,
	action = null,
	errorMessage = null,
	inFlight = false,
	setAction,
	setEndpoints,
	wizardApiFetch,
}: {
	endpoint: Endpoint;
	actions: string[];
	errorMessage: string | null;
	inFlight: boolean;
	action: WebhookActions;
	setAction: ( action: WebhookActions, id: number | string ) => void;
	wizardApiFetch: < T = any >( opts: ApiFetchOptions, callbacks?: ApiFetchCallbacks< T > ) => void;
	setEndpoints: ( endpoints: Endpoint[] ) => void;
} ) => {
	const [ editing, setEditing ] = useState< Endpoint >( endpoint );

	const {
		wizardApiFetch: testWizardApiFetch,
		errorMessage: testError,
		resetError: resetTestError,
	} = useWizardApiFetch( `${ API_NAMESPACE }/tests` );

	const onSuccess = ( endpointId: string | number, response: Endpoint[] ) => {
		setEndpoints( response );
		setAction( null, endpointId );
	};

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
		</Fragment>
	);
};

export default Upsert;
