/**
 * New/Edit Ad Unit Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';
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
 * New/Edit Ad Unit Screen.
 */
class EditAdUnitScreen extends Component {
	/**
	 * Handle an update to an ad unit field.
	 *
	 * @param string key Ad Unit field
	 * @param mixed  value New value for field
	 *
	 */
	handleOnChange( key, value ) {
		const { adUnit, onChange } = this.props;
		adUnit[ key ] = value;
		onChange( adUnit );
	}

	/**
	 * Render.
	 */
	render() {
		const { adUnit, onClickSave } = this.props;
		const { id, name, code } = adUnit;

		const editing_existing_ad_unit = !! id;
		return (
			<div className="newspack-edit-ad-unit-screen">
				<TextControl
					label={ __( 'What is this ad unit called?' ) }
					value={ name }
					onChange={ value => this.handleOnChange( 'name', value ) }
				/>
				<TextareaControl
					label={ __( 'Paste the ad code from Google Ad Manager here' ) }
					value={ code }
					onChange={ value => this.handleOnChange( 'code', value ) }
				/>
				<Button isPrimary className="is-centered" onClick={ () => onClickSave( adUnit ) }>
					{ __( 'Save' ) }
				</Button>
				<Button
					className="newspack-edit-ad-unit-screen__cancel isLink is-centered is-tertiary"
					href="#/"
				>
					{ __( 'Cancel' ) }
				</Button>
			</div>
		);
	}
}

export default withWizardScreen( EditAdUnitScreen );
