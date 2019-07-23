/**
 * Donation settings screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TextControl, ImageUpload, InfoButton, withWizardScreen } from '../../../components/src';

/**
 * Settings for donation collection.
 */
class DonationSettingsScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const { name, suggestedAmount, onChange } = this.props;
		let { image } = this.props;
		if ( ! image || '0' === image.id ) {
			image = null;
		}

		return (
			<Fragment>
				<TextControl
					label={ __( 'What is the plan called? e.g. Valued Donor' ) }
					value={ name }
					onChange={ value => onChange( 'name', value ) }
				/>
				<ImageUpload
					image={ image }
					onChange={ value => onChange( 'image', value ) }
				/>
				<div className='newspack-donations-wizard__suggested-price'>
					<TextControl
						type="number"
						step="0.01"
						label={ __( 'Suggested donation amount per month' ) }
						value={ suggestedAmount }
						onChange={ value => onChange( 'suggestedAmount', value ) }
					/>
					<InfoButton text={ __( 'For example, "15" will have a suggested monthly donation of $15 and a suggested yearly donation of $180' ) } />
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( DonationSettingsScreen, {} );
