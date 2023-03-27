/* global newspack_connections_data */
/**
 * External dependencies
 */
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { CheckboxControl, MenuItem } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Icon, settings, check, close, reusableBlock, moreVertical } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

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
	Popover,
} from '../../../../components/src';

const getDisplayUrl = url => {
	let displayUrl = url.slice( 8 );
	if ( url.length > 45 ) {
		displayUrl = `${ url.slice( 8, 38 ) }...${ url.slice( -10 ) }`;
	}
	return displayUrl;
};

const getEndpointLabel = endpoint => {
	const { label, url } = endpoint;
	return label || getDisplayUrl( url );
};

const getEndpointTitle = endpoint => {
	const { label, url } = endpoint;
	return (
		<>
			{ label && <span className="newspack-webhooks__endpoint__label">{ label }</span> }
			<span className="newspack-webhooks__endpoint__url">{ getDisplayUrl( url ) }</span>
		</>
	);
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

const EndpointActions = ( {
	disabled,
	position = 'bottom left',
	onEdit = () => {},
	onDelete = () => {},
	onView = () => {},
} ) => {
	const [ popoverVisible, setPopoverVisible ] = useState( false );
	useEffect( () => {
		setPopoverVisible( false );
	}, [ disabled ] );
	return (
		<>
			<Button
				className={ popoverVisible && 'popover-active' }
				onClick={ () => setPopoverVisible( ! popoverVisible ) }
				icon={ moreVertical }
				disabled={ disabled }
				label={ __( 'Endpoint Actions', 'newspack' ) }
				tooltipPosition={ position }
			/>
			{ popoverVisible && (
				<Popover
					position={ position }
					onFocusOutside={ () => setPopoverVisible( false ) }
					onKeyDown={ event => ESCAPE === event.keyCode && setPopoverVisible( false ) }
				>
					<MenuItem onClick={ () => setPopoverVisible( false ) } className="screen-reader-text">
						{ __( 'Close Endpoint Actions', 'newspack' ) }
					</MenuItem>
					<MenuItem onClick={ onView } className="newspack-button">
						{ __( 'View Requests', 'newspack' ) }
					</MenuItem>
					<MenuItem onClick={ onEdit } className="newspack-button">
						{ __( 'Edit', 'newspack' ) }
					</MenuItem>
					<MenuItem onClick={ onDelete } className="newspack-button" isDestructive>
						{ __( 'Remove', 'newspack' ) }
					</MenuItem>
				</Popover>
			) }
		</>
	);
};

const ConfirmationModal = ( { disabled, onConfirm, onClose, title, description } ) => {
	return (
		<Modal title={ title } onRequestClose={ onClose }>
			<p>{ description }</p>
			<Card buttonsCard noBorder className="justify-end">
				<Button isSecondary onClick={ onClose } disabled={ disabled }>
					{ __( 'Cancel', 'newspack' ) }
				</Button>
				<Button isPrimary onClick={ onConfirm } disabled={ disabled }>
					{ __( 'Confirm', 'newspack' ) }
				</Button>
			</Card>
		</Modal>
	);
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
	const [ deleting, setDeleting ] = useState( false );
	const [ toggling, setToggling ] = useState( false );
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
				setToggling( false );
			} );
	};
	const deleteEndpoint = endpoint => {
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
				setDeleting( false );
			} );
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
							toggleOnChange={ () => setToggling( endpoint ) }
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
								<EndpointActions
									onEdit={ () => setEditing( endpoint ) }
									onDelete={ () => setDeleting( endpoint ) }
									onView={ () => setViewing( endpoint ) }
								/>
							}
						/>
					) ) }
				</>
			) }
			{ false !== deleting && (
				<ConfirmationModal
					title={ __( 'Remove Endpoint', 'newspack' ) }
					description={ sprintf(
						/* translators: %s: endpoint title */
						__( 'Are you sure you want to remove the endpoint %s?', 'newspack' ),
						`"${ getDisplayUrl( deleting.url ) }"`
					) }
					onClose={ () => setDeleting( false ) }
					onConfirm={ () => deleteEndpoint( deleting ) }
					disabled={ inFlight }
				/>
			) }
			{ false !== toggling && (
				<ConfirmationModal
					title={
						toggling.disabled
							? __( 'Enable Endpoint', 'newspack' )
							: __( 'Disable Endpoint', 'newspack' )
					}
					description={
						toggling.disabled
							? sprintf(
									/* translators: %s: endpoint title */
									__( 'Are you sure you want to enable the endpoint %s?', 'newspack' ),
									`"${ getDisplayUrl( toggling.url ) }"`
							  )
							: sprintf(
									/* translators: %s: endpoint title */
									__( 'Are you sure you want to disable the endpoint %s?', 'newspack' ),
									`"${ getDisplayUrl( toggling.url ) }"`
							  )
					}
					endpoint={ toggling }
					onClose={ () => setToggling( false ) }
					onConfirm={ () => toggleEndpoint( toggling ) }
					disabled={ inFlight }
				/>
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
							getEndpointLabel( viewing )
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
													moment( parseInt( request.scheduled ) * 1000 ).fromNow( true )
											  )
											: sprintf(
													// translators: %s is a human-readable time difference.
													__( 'processed %s', 'newspack' ),
													moment( parseInt( request.scheduled ) * 1000 ).fromNow()
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
					<TextControl
						label={ __( 'Label (optional)', 'newspack' ) }
						help={ __(
							'A label to help you identify this endpoint. It will not be sent to the endpoint.',
							'newspack'
						) }
						value={ editing.label }
						onChange={ value => setEditing( { ...editing, label: value } ) }
						disabled={ inFlight }
					/>
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
						{ actions.length > 0 && (
							<>
								<p>
									{ __(
										'If this endpoint is not global, select which actions should trigger this endpoint:',
										'newspack'
									) }
								</p>
								<Grid columns={ 2 } gutter={ 16 }>
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
							</>
						) }
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
