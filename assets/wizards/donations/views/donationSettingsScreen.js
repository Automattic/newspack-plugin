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
import { TextControl, ImageUpload, ToggleGroup, withWizardScreen } from '../../../components/src';

/**
 * Settings for donation collection.
 */
class DonationSettingsScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const { name, suggestedAmount, suggestedAmountLow, suggestedAmountHigh, tiered, onChange } = this.props;
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

				<h3>{ __( 'Suggested donation amount per month' ) }</h3>
				<p className='newspack-donations-wizard__help'>
					{ __( 'Set a suggested monthly donation amount. This will provide hints to readers about how much to donate, which will increase the average donation amount.' ) }
				</p>

				<ToggleGroup
					title={ __( 'Suggest low, middle, and high tiers for monthly donations' ) }
					checked={ tiered }
					onChange={ tiered => onChange( 'tiered', tiered ) }
				>
					<div className='newspack-donations-wizard__tier-suggested-prices'>
						<TextControl
							type="number"
							step="0.01"
							label={ __( 'Low-tier' ) }
							value={ suggestedAmount / 2 }
							onChange={ value => onChange( 'suggestedAmountLow', value ) }
						/>
						<TextControl
							type="number"
							step="0.01"
							label={ __( 'Mid-tier' ) }
							value={ suggestedAmount }
							onChange={ value => onChange( 'suggestedAmount', value ) }
						/>
						<TextControl
							type="number"
							step="0.01"
							label={ __( 'High-tier' ) }
							value={ suggestedAmount * 2 }
							onChange={ value => onChange( 'suggestedAmountHigh', value ) }
						/>
					</div>
				</ToggleGroup>
				{ ! tiered && (
					<div className='newspack-donations-wizard__suggested-price'>
						<TextControl
							type="number"
							step="0.01"
							label={ __( 'Suggested donation amount per month' ) }
							value={ suggestedAmount }
							onChange={ value => { 
								onChange( 'suggestedAmount', value ); 
								onChange( 'suggestedAmountHigh', 2 * value ); 
								onChange( 'suggestedAmountLow', value / 2 ); 
							} }
						/>
					</div>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( DonationSettingsScreen, {} );
