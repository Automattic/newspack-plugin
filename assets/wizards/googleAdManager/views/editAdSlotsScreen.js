/**
 * New/Edit Ad Slot Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Card,
	FormattedHeader,
	Button,
	TextControl,
	withWizardScreen,
} from '../../../components/src';

/**
 * New/Edit Ad Slot Screen.
 */
class EditAdSlotScreen extends Component {
	/**
	 * Handle an update to an ad slot field.
	 *
	 * @param string key Ad Slot field
	 * @param mixed  value New value for field
	 *
	 */
	handleOnChange( key, value ) {
		const { adSlot, onChange } = this.props;
		adSlot[ key ] = value;
		onChange( adSlot );
	}

	/**
	 * Render.
	 */
	render() {
		const { adSlot, onClickSave } = this.props;
		const { id, name, code } = adSlot;

		const editing_existing_ad_slot = !! id;
		return (
			<div className="newspack-edit-ad-slot-screen">
				<TextControl
					label={ __( 'What is this ad slot called?' ) }
					value={ name }
					onChange={ value => this.handleOnChange( 'name', value ) }
				/>
				<TextControl
					label={ __( 'Paste the ad code from Google Ad Manager here' ) }
					value={ code }
					onChange={ value => this.handleOnChange( 'code', value ) }
				/>
				<Button isPrimary className="is-centered" onClick={ () => onClickSave( adSlot ) }>
					{ __( 'Save' ) }
				</Button>
				<Button
					className="newspack-edit-ad-slot-screen__cancel isLink is-centered is-tertiary"
					href="#/"
				>
					{ __( 'Cancel' ) }
				</Button>
			</div>
		);
	}
}

export default withWizardScreen( EditAdSlotScreen );
