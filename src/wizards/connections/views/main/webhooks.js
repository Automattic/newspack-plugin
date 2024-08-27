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
	isSystem,
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
				label={ __( 'Endpoint Actions', 'newspack-plugin' ) }
				tooltipPosition={ position }
			/>
			{ popoverVisible && (
				<Popover
					position={ position }
					onFocusOutside={ () => setPopoverVisible( false ) }
					onKeyDown={ event => ESCAPE === event.keyCode && setPopoverVisible( false ) }
				>
					<MenuItem onClick={ () => setPopoverVisible( false ) } className="screen-reader-text">
						{ __( 'Close Endpoint Actions', 'newspack-plugin' ) }
					</MenuItem>
					<MenuItem onClick={ onView } className="newspack-button">
						{ __( 'View Requests', 'newspack-plugin' ) }
					</MenuItem>
					{ ! isSystem && (
						<MenuItem onClick={ onEdit } className="newspack-button">
							{ __( 'Edit', 'newspack-plugin' ) }
						</MenuItem>
					) }
					{ ! isSystem && (
						<MenuItem onClick={ onDelete } className="newspack-button" isDestructive>
							{ __( 'Remove', 'newspack-plugin' ) }
						</MenuItem>
					) }
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
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button isPrimary onClick={ onConfirm } disabled={ disabled }>
					{ __( 'Confirm', 'newspack-plugin' ) }
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
	const sendTestRequest = ( url, bearer_token ) => {
		setInFlight( true );
		setTestError( false );
		setTestResponse( false );
		apiFetch( {
			path: '/newspack/v1/webhooks/endpoints/test',
			method: 'POST',
			data: { url, bearer_token },
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

	return (
		<Card noBorder className="mt64">
			{ false !== error && <Notice isError noticeText={ error.message } /> }

			<div className="flex justify-between items-end">
				<SectionHeader
					title={ __( 'Webhook Endpoints', 'newspack-plugin' ) }
					description={ __(
						'Register webhook endpoints to integrate reader activity data to third-party services or private APIs',
						'newspack-plugin'
					) }
					noMargin
				/>
				<Button
					variant="primary"
					onClick={ () => setEditing( { global: true } ) }
					disabled={ inFlight }
				>
					{ __( 'Add New Endpoint', 'newspack-plugin' ) }
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
							disabled={ endpoint.system }
							description={ () => {
								if ( endpoint.disabled && endpoint.disabled_error ) {
									return (
										__(
											'This endpoint is disabled due to excessive request errors',
											'newspack-plugin'
										) +
										': ' +
										endpoint.disabled_error
									);
								}
								return (
									<>
										{ __( 'Actions:', 'newspack-plugin' ) }{ ' ' }
										{ endpoint.global ? (
											<span className="newspack-webhooks__endpoint__action">
												{ __( 'global', 'newspack-plugin' ) }
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
									isSystem={ endpoint.system }
								/>
							}
						/>
					) ) }
				</>
			) }
			{ false !== deleting && (
				<ConfirmationModal
					title={ __( 'Remove Endpoint', 'newspack-plugin' ) }
					description={ sprintf(
						/* translators: %s: endpoint title */
						__( 'Are you sure you want to remove the endpoint %s?', 'newspack-plugin' ),
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
							? __( 'Enable Endpoint', 'newspack-plugin' )
							: __( 'Disable Endpoint', 'newspack-plugin' )
					}
					description={
						toggling.disabled
							? sprintf(
								/* translators: %s: endpoint title */
								__( 'Are you sure you want to enable the endpoint %s?', 'newspack-plugin' ),
								`"${ getDisplayUrl( toggling.url ) }"`
							) : sprintf(
								/* translators: %s: endpoint title */
								__( 'Are you sure you want to disable the endpoint %s?', 'newspack-plugin' ),
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
					title={ __( 'Latest Requests', 'newspack-plugin' ) }
					onRequestClose={ () => setViewing( false ) }
				>
					<p>
						{ sprintf(
							// translators: %s is the endpoint title (shortened URL).
							__( 'Most recent requests for %s', 'newspack-plugin' ),
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
								<th colSpan="2">{ __( 'Action', 'newspack-plugin' ) }</th>
								{ hasEndpointErrors( viewing ) && (
									<th colSpan="2">{ __( 'Error', 'newspack-plugin' ) }</th>
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
												__( 'sending in %s', 'newspack-plugin' ),
												moment( parseInt( request.scheduled ) * 1000 ).fromNow( true )
											)
											: sprintf(
												// translators: %s is a human-readable time difference.
												__( 'processed %s', 'newspack-plugin' ),
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
			{ false !== editing && (
				<Modal
					title={ __( 'Webhook Endpoint', 'newspack-plugin' ) }
					onRequestClose={ () => {
						setEditing( false );
						setEditingError( false );
					} }
				>
					{ false !== editingError && <Notice isError noticeText={ editingError.message } /> }
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
							onChange={ value => setEditing( { ...editing, url: value } ) }
							disabled={ inFlight }
						/>
						<TextControl
							label={ __( 'Authentication token (optional)', 'newspack-plugin' ) }
							help={ __(
								'If your endpoint requires a token authentication, enter it here. It will be sent as a Bearer token in the Authorization header.',
								'newspack-plugin'
							) }
							value={ editing.bearer_token }
							onChange={ value => setEditing( { ...editing, bearer_token: value } ) }
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
						onChange={ value => setEditing( { ...editing, label: value } ) }
						disabled={ inFlight }
					/>
					<Grid columns={ 1 } gutter={ 16 }>
						<h3>{ __( 'Actions', 'newspack-plugin' ) }</h3>
						<CheckboxControl
							checked={ editing.global }
							onChange={ value => setEditing( { ...editing, global: value } ) }
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
									{ actions.map( ( action, i ) => (
										<CheckboxControl
											key={ i }
											disabled={ editing.global || inFlight }
											label={ action }
											checked={ ( editing.actions && editing.actions.includes( action ) ) || false }
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
								{ __( 'Save', 'newspack-plugin' ) }
							</Button>
						</Card>
					</Grid>
				</Modal>
			) }
		</Card>
	);
};

export default Webhooks;
