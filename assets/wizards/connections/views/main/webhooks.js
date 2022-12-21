/* global newspack_connections_data */
/**
 * External dependencies
 */
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Icon, settings, trash, info, check, close, reusableBlock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	Card,
	ActionCard,
	Button,
	Grid,
	Notice,
	SectionHeader,
	Modal,
	TextControl,
} from '../../../../components/src';

const getEndpointTitle = endpoint => {
	if ( endpoint.url.length > 45 ) {
		return `${ endpoint.url.slice( 8, 38 ) }...${ endpoint.url.slice( -10 ) }`;
	}
	return endpoint.url.slice( 8 );
};

const getRequestStatusIcon = status => {
	const icons = {
		pending: reusableBlock,
		finished: check,
		killed: close,
	};
	return icons[ status ] || settings;
};

const hasEndpointErrors = endpoint => {
	return endpoint.requests.some( request => request.errors.length );
};

const Webhooks = () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );

	const [ actions, setActions ] = useState( [] );
	const fetchActions = () => {
		apiFetch( { path: '/newspack/v1/data-events/actions' } )
			.then( response => {
				setActions( response );
			} )
			.catch( err => {
				setError( err );
			} );
	};

	const [ endpoints, setEndpoints ] = useState( [] );
	const [ viewing, setViewing ] = useState( false );
	const [ editing, setEditing ] = useState( false );
	const [ editingError, setEditingError ] = useState( false );

	const fetchEndpoints = () => {
		setInFlight( true );
		apiFetch( { path: '/newspack/v1/webhooks/endpoints' } )
			.then( response => {
				setEndpoints( response );
			} )
			.catch( err => {
				setError( err );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};
	const toggleEndpoint = endpoint => {
		const confirmationText = endpoint.disabled
			? __( 'Are you sure you want to enable this endpoint?', 'newspack' )
			: __( 'Are you sure you want to disable this endpoint?', 'newspack' );
		// eslint-disable-next-line no-alert
		if ( confirm( confirmationText ) ) {
			setInFlight( true );
			apiFetch( {
				path: `/newspack/v1/webhooks/endpoints/${ endpoint.id }`,
				method: 'POST',
				data: { disabled: ! endpoint.disabled },
			} )
				.then( response => {
					setEndpoints( response );
				} )
				.catch( err => {
					setError( err );
				} )
				.finally( () => {
					setInFlight( false );
				} );
		}
	};
	const removeEndpoint = endpoint => {
		// eslint-disable-next-line no-alert
		if ( confirm( __( 'Are you sure you want to remove this endpoint?', 'newspack' ) ) ) {
			setInFlight( true );
			apiFetch( {
				path: `/newspack/v1/webhooks/endpoints/${ endpoint.id }`,
				method: 'DELETE',
			} )
				.then( response => {
					setEndpoints( response );
				} )
				.catch( err => {
					setError( err );
				} )
				.finally( () => {
					setInFlight( false );
				} );
		}
	};
	const upsertEndpoint = endpoint => {
		setInFlight( true );
		setEditingError( false );
		apiFetch( {
			path: `/newspack/v1/webhooks/endpoints/${ endpoint.id || '' }`,
			method: 'POST',
			data: endpoint,
		} )
			.then( response => {
				setEndpoints( response );
				setEditing( false );
			} )
			.catch( err => {
				setEditingError( err );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};

	const [ testResponse, setTestResponse ] = useState( false );
	const [ testError, setTestError ] = useState( false );
	const sendTestRequest = url => {
		setInFlight( true );
		setTestError( false );
		setTestResponse( false );
		apiFetch( {
			path: '/newspack/v1/webhooks/endpoints/test',
			method: 'POST',
			data: { url },
		} )
			.then( response => {
				setTestResponse( response );
			} )
			.catch( err => {
				setTestError( err );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};

	useEffect( fetchActions, [] );
	useEffect( fetchEndpoints, [] );

	useEffect( () => {
		setTestResponse( false );
		setEditingError( false );
		setTestError( false );
	}, [ editing ] );

	if ( ! newspack_connections_data.can_use_webhooks ) {
		return null;
	}

	return (
		<Card noBorder className="mt64">
			{ false !== error && <Notice isError noticeText={ error.message } /> }

			<div className="flex justify-between items-end">
				<SectionHeader
					title={ __( 'Webhook Endpoints', 'newspack' ) }
					description={ __(
						'Register webhook endpoints to integrate reader activity data to third-party services or private APIs',
						'newspack'
					) }
					noMargin
				/>
				<Button
					variant="primary"
					onClick={ () => setEditing( { global: true } ) }
					disabled={ inFlight }
				>
					{ __( 'Add New Endpoint', 'newspack' ) }
				</Button>
			</div>

			{ endpoints.length > 0 && (
				<>
					{ endpoints.map( endpoint => (
						<ActionCard
							isMedium
							className="newspack-webhooks__endpoint mt16"
							toggleChecked={ ! endpoint.disabled }
							toggleOnChange={ () => toggleEndpoint( endpoint ) }
							key={ endpoint.id }
							title={ getEndpointTitle( endpoint ) }
							description={ () => {
								if ( endpoint.disabled && endpoint.disabled_error ) {
									return (
										__( 'This endpoint is disabled due excessive request errors: ', 'newspack' ) +
										endpoint.disabled_error
									);
								}
								return (
									<>
										{ __( 'Actions:', 'newspack' ) }{ ' ' }
										{ endpoint.global ? (
											<span className="newspack-webhooks__endpoint__action">
												{ __( 'global', 'newspack' ) }
											</span>
										) : (
											endpoint.actions.map( action => (
												<span key={ action } className="newspack-webhooks__endpoint__action">
													{ action }
												</span>
											) )
										) }
									</>
								);
							} }
							actionText={
								<>
									<Button
										onClick={ () => removeEndpoint( endpoint ) }
										icon={ trash }
										disabled={ inFlight }
										label={ __( 'Remove endpoint', 'newspack' ) }
										tooltipPosition="bottom center"
									/>
									<Button
										onClick={ () => setViewing( endpoint ) }
										icon={ info }
										disabled={ inFlight }
										label={ __( 'View endpoint requests', 'newspack' ) }
										tooltipPosition="bottom center"
									/>
									<Button
										onClick={ () => setEditing( { ...endpoint } ) }
										icon={ settings }
										disabled={ inFlight }
										label={ __( 'Edit endpoint', 'newspack' ) }
										tooltipPosition="bottom center"
									/>
								</>
							}
						/>
					) ) }
				</>
			) }
			{ false !== viewing && (
				<Modal
					title={ __( 'Latest Requests', 'newspack' ) }
					onRequestClose={ () => setViewing( false ) }
				>
					<p>
						{ sprintf(
							// translators: %s is the endpoint title (shortened URL).
							__( 'Most recent requests for %s', 'newspack' ),
							getEndpointTitle( viewing )
						) }
					</p>
					{ viewing.requests.length > 0 ? (
						<table
							className={ `newspack-webhooks__requests ${
								hasEndpointErrors( viewing ) ? 'has-error' : ''
							}` }
						>
							<tr>
								<th />
								<th colSpan="2">{ __( 'Action', 'newspack' ) }</th>
								{ hasEndpointErrors( viewing ) && (
									<th colSpan="2">{ __( 'Error', 'newspack' ) }</th>
								) }
							</tr>
							{ viewing.requests.map( request => (
								<tr key={ request.id }>
									<td className={ `status status--${ request.status }` }>
										<Icon icon={ getRequestStatusIcon( request.status ) } />
									</td>
									<td className="action-name">{ request.action_name }</td>
									<td className="scheduled">
										{ 'pending' === request.status
											? sprintf(
													// translators: %s is a human-readable time difference.
													__( 'sending in %s', 'newspack' ),
													moment( request.scheduled.date + request.scheduled.timezone ).fromNow(
														true
													)
											  )
											: sprintf(
													// translators: %s is a human-readable time difference.
													__( 'processed %s', 'newspack' ),
													moment( request.scheduled.date + request.scheduled.timezone ).fromNow()
											  ) }
									</td>
									{ hasEndpointErrors( viewing ) && (
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
														__( 'Attempt #%s', 'newspack' ),
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
							noticeText={ __( "This endpoint didn't received any requests yet.", 'newspack' ) }
						/>
					) }
				</Modal>
			) }
			{ false !== editing && (
				<Modal
					title={ __( 'Webhook Endpoint', 'newspack' ) }
					onRequestClose={ () => {
						setEditing( false );
						setEditingError( false );
					} }
				>
					{ false !== editingError && <Notice isError noticeText={ editingError.message } /> }
					{ true === editing.disabled && (
						<Notice
							noticeText={ __( 'This webhook endpoint is currently disabled.', 'newspack' ) }
							className="mt0"
						/>
					) }
					{ editing.disabled && editing.disabled_error && (
						<Notice
							isError
							noticeText={ __( 'Request Error: ', 'newspack' ) + editing.disabled_error }
							className="mt0"
						/>
					) }
					{ testError && (
						<Notice
							isError
							noticeText={ __( 'Test Error: ', 'newspack' ) + testError.message }
							className="mt0"
						/>
					) }
					<Grid columns={ 1 } gutter={ 16 } className="mt0">
						<TextControl
							label={ __( 'URL', 'newspack' ) }
							help={ __(
								"The URL to send requests to. It's required for the URL to be under a valid TLS/SSL certificate. You can use the test button below to verify the endpoint response.",
								'newspack'
							) }
							className="code"
							value={ editing.url }
							onChange={ value => setEditing( { ...editing, url: value } ) }
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
								onClick={ () => sendTestRequest( editing.url ) }
								disabled={ inFlight || ! editing.url }
							>
								{ __( 'Send a test request', 'newspack' ) }
							</Button>
						</Card>
					</Grid>
					<hr />
					<Grid columns={ 1 } gutter={ 16 }>
						<h3>{ __( 'Actions', 'newspack' ) }</h3>
						<CheckboxControl
							checked={ editing.global }
							onChange={ value => setEditing( { ...editing, global: value } ) }
							label={ __( 'Global', 'newspack' ) }
							help={ __(
								'Leave this checked if you want this endpoint to receive data from all actions.',
								'newspack'
							) }
							disabled={ inFlight }
						/>
						<p>
							{ __(
								'If this endpoint is not global, select which actions should trigger this endpoint:',
								'newspack'
							) }
						</p>
						<Grid columns={ 3 } gutter={ 16 }>
							{ actions.map( ( action, i ) => (
								<CheckboxControl
									key={ i }
									disabled={ editing.global || inFlight }
									label={ action }
									checked={ editing.actions && editing.actions.includes( action ) }
									indeterminate={ editing.global }
									onChange={ () => {
										const currentActions = editing.actions || [];
										if ( currentActions.includes( action ) ) {
											currentActions.splice( currentActions.indexOf( action ), 1 );
										} else {
											currentActions.push( action );
										}
										setEditing( { ...editing, actions: currentActions } );
									} }
								/>
							) ) }
						</Grid>
						<Card buttonsCard noBorder className="justify-end">
							<Button
								isPrimary
								onClick={ () => {
									upsertEndpoint( editing );
								} }
								disabled={ inFlight }
							>
								{ __( 'Save', 'newspack' ) }
							</Button>
						</Card>
					</Grid>
				</Modal>
			) }
		</Card>
	);
};

export default Webhooks;
