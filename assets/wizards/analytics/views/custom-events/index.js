/* global newspack_analytics_wizard_data */

/**
 * External dependencies
 */
import { find } from 'lodash';
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	Notice,
	TextControl,
	SelectControl,
	CheckboxControl,
	withWizardScreen,
	Modal,
} from '../../../../components/src';
import { NEWSPACK_SUPPORT_URL } from '../../../../components/src/consts';

/**
 * Not implemented:
 * - visibility, ini-load: require the element to be AMP element,
 * - scroll: requires some more UI for scroll parameters, can be implemented later.
 */
const TRIGGER_OPTIONS = [
	{ value: 'click', label: __( 'Click', 'newspack' ) },
	{ value: 'submit', label: __( 'Submit', 'newspack' ) },
];

const NEW_EVENT_TEMPLATE = {
	event_name: '',
	event_category: '',
	event_label: '',
	on: TRIGGER_OPTIONS[ 0 ].value,
	element: '',
	amp_element: '',
	non_interaction: true,
	is_active: true,
};

const validateEvent = event =>
	Boolean( event.event_name && event.event_category && event.on && event.element );

/**
 * Analytics Custom Events screen.
 */
class CustomEvents extends Component {
	state = {
		error: newspack_analytics_wizard_data.analyticsConnectionError,
		customEvents: newspack_analytics_wizard_data.customEvents,
		editedEvent: NEW_EVENT_TEMPLATE,
		editedEventId: null,
	};

	handleAPIError = ( { message: error } ) => this.setState( { error } );

	updateCustomEvents = updatedEvents => {
		const { wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/analytics/custom-events',
			method: 'POST',
			data: { events: updatedEvents },
		} )
			.then( ( { events } ) =>
				this.setState( {
					customEvents: events,
					editedEvent: NEW_EVENT_TEMPLATE,
					editedEventId: null,
				} )
			)
			.catch( this.handleAPIError );
	};

	handleCustomEventEdit = () => {
		const { customEvents, editedEvent, editedEventId } = this.state;
		if ( editedEventId === 'new' ) {
			this.updateCustomEvents( [ ...customEvents, editedEvent ] );
		} else {
			this.updateCustomEvents(
				customEvents.map( event => {
					if ( event.id === editedEventId ) {
						return editedEvent;
					}
					return event;
				} )
			);
		}
	};

	updateEditedEvent = key => value =>
		this.setState( ( { editedEvent } ) => ( { editedEvent: { ...editedEvent, [ key ]: value } } ) );

	setEditModal = editedEventId => () => {
		const editedEvent =
			editedEventId !== null && find( this.state.customEvents, [ 'id', editedEventId ] );
		this.setState( {
			editedEventId,
			...( editedEvent
				? {
						editedEvent,
				  }
				: {
						editedEvent: NEW_EVENT_TEMPLATE,
				  } ),
		} );
	};

	render() {
		const { error, customEvents, editedEvent, editedEventId } = this.state;
		const { isLoading } = this.props;

		const isCreatingEvent = editedEventId === 'new';

		return (
			<div className="newspack__analytics-configuration newspack-card newspack-card__no-background">
				<p>
					{ __(
						'Custom events are used to collect and analyze specific user interactions.',
						'newspack'
					) }
				</p>
				<Notice
					rawHTML
					isInfo
					noticeText={ `${ __(
						'This is an advanced feature, read more about it on our',
						'newspack'
					) } <a href="${ NEWSPACK_SUPPORT_URL }/analytics">${ __(
						'support page',
						'newspack'
					) }</a>.` }
				/>
				{ error ? (
					<Notice noticeText={ error } isError />
				) : (
					<Fragment>
						<table>
							<thead>
								<tr>
									{ [
										__( 'Active', 'newspack' ),
										__( 'Action', 'newspack' ),
										__( 'Category', 'newspack' ),
										__( 'Label', 'newspack' ),
										__( 'Trigger', 'newspack' ),
										__( 'Edit', 'newspack' ),
									].map( ( colName, i ) => (
										<th key={ i }>{ colName }</th>
									) ) }
								</tr>
							</thead>
							<tbody>
								{ customEvents.map( event => (
									<tr key={ event.id }>
										<td>{ event.is_active ? <DoneIcon /> : <ClearIcon /> }</td>
										<td>{ event.event_name }</td>
										<td>{ event.event_category }</td>
										<td>{ event.event_label }</td>
										<td>
											<code>{ event.on }</code>
										</td>
										<td>
											<Button isSmall isLink onClick={ this.setEditModal( event.id ) }>
												{ __( 'Edit', 'newspack' ) }
											</Button>
										</td>
									</tr>
								) ) }
							</tbody>
						</table>

						<Button onClick={ this.setEditModal( 'new' ) } isPrimary>
							{ __( 'Create a new custom event', 'newspack' ) }
						</Button>

						{ editedEventId !== null && (
							<Modal
								title={
									isCreatingEvent
										? __( 'New custom event', 'newspack' )
										: __( 'Editing custom event', 'newspack' )
								}
								onRequestClose={ this.setEditModal( null ) }
							>
								<div>
									<TextControl
										disabled={ isLoading }
										value={ editedEvent.event_name }
										onChange={ this.updateEditedEvent( 'event_name' ) }
										label={ __( 'Action', 'newspack' ) }
										required
									/>
									<TextControl
										disabled={ isLoading }
										value={ editedEvent.event_category }
										onChange={ this.updateEditedEvent( 'event_category' ) }
										label={ __( 'Category', 'newspack' ) }
										required
									/>
									<TextControl
										disabled={ isLoading }
										value={ editedEvent.event_label }
										onChange={ this.updateEditedEvent( 'event_label' ) }
										label={ __( 'Label', 'newspack' ) }
									/>
									<SelectControl
										disabled={ isLoading }
										value={ editedEvent.on }
										onChange={ this.updateEditedEvent( 'on' ) }
										label={ __( 'Trigger', 'newspack' ) }
										options={ TRIGGER_OPTIONS }
										required
									/>
									<TextControl
										disabled={ isLoading }
										value={ editedEvent.element }
										onChange={ this.updateEditedEvent( 'element' ) }
										label={ __( 'Selector', 'newspack' ) }
										className="newspack__analytics-configuration__code"
										required
									/>
									<TextControl
										disabled={ isLoading }
										value={ editedEvent.amp_element }
										onChange={ this.updateEditedEvent( 'amp_element' ) }
										label={ __( 'AMP Selector', 'newspack' ) }
										className="newspack__analytics-configuration__code"
									/>
									<CheckboxControl
										disabled={ isLoading }
										checked={ editedEvent.non_interaction }
										onChange={ this.updateEditedEvent( 'non_interaction' ) }
										label={ __( 'Non-interaction event', 'newspack' ) }
									/>
									<CheckboxControl
										disabled={ isLoading }
										checked={ editedEvent.is_active }
										onChange={ this.updateEditedEvent( 'is_active' ) }
										label={ __( 'Active', 'newspack' ) }
									/>
									<Button
										onClick={ this.handleCustomEventEdit }
										disabled={ ! validateEvent( editedEvent ) || isLoading }
										isPrimary
									>
										{ isCreatingEvent ? __( 'Create', 'newspack' ) : __( 'Update', 'newspack' ) }
									</Button>
									{ ! isCreatingEvent && (
										<Button
											disabled={ isLoading }
											onClick={ () =>
												this.updateCustomEvents(
													this.state.customEvents.filter( ( { id } ) => editedEvent.id !== id )
												)
											}
										>
											{ __( 'Delete', 'newspack' ) }
										</Button>
									) }
								</div>
							</Modal>
						) }
					</Fragment>
				) }
			</div>
		);
	}
}

export default withWizardScreen( CustomEvents );
