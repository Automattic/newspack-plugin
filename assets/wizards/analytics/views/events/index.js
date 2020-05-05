/**
 * Syndication Intro View
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	CheckboxControl,
	TextControl,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Syndication Intro screen.
 */
class Events extends Component {
	onEventChange( eventCategory, active ) {
		const { eventsEnabled, eventCategories, onChange } = this.props;

		for ( let i = 0; i < eventCategories.length; ++i ) {
			if ( eventCategories[i].name === eventCategory ) {
				eventCategories[i].active = active;
			}
		}

		onChange( { eventCategories, eventsEnabled } );
	}

	/**
	 * Render.
	 */
	render() {
		const { eventsEnabled, eventCategories, onChange } = this.props;

		return (
			<div className="newspack-analytics-events-setup-screen">
				<ToggleControl
					label={ __( 'Enable automated Google Analytics event tracking' ) }
					checked={ eventsEnabled }
					onChange={ _eventsEnabled => onChange( { events, eventsEnabled: _eventsEnabled } ) }
				/>
				{ eventsEnabled && (
					<Fragment>
						<h2 className="newspack-analytics-events-setup-screen__settings-heading">
							{ __( 'Types of events to collect' ) }
						</h2>
						{ eventCategories.map( eventCategory => (
							<CheckboxControl
								label={ eventCategory.name }
								checked={ eventCategory.active }
								onChange={ _enabled => this.onEventChange( eventCategory.name, _enabled ) }
								key={ eventCategory.name }
							/>
						) ) }
					</Fragment>
				) }
			</div>
		);
	}
}

export default withWizardScreen( Events );
