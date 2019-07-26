/**
 * Donation settings screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { TextControl, ImageUpload, withWizardScreen } from '../../../components/src';
import MoneyInput from './moneyInput';

/**
 * Settings for donation collection.
 */
class DonationSettingsScreen extends Component {

	onSuggestedAmountChange( index, value ) {
		const { suggestedAmounts, onChange } = this.props;
		suggestedAmounts[index] = '' !== value ? value : 0;
		onChange( 'suggestedAmounts', suggestedAmounts );
	}

	/**
	 * Render.
	 */
	render() {
		const { name, suggestedAmounts, suggestedAmountUntiered, currencySymbol, tiered, onChange } = this.props;
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

				{ tiered && (
					<div className='newspack-donations-wizard__tier-suggested-prices'>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Low-tier' ) }
							value={ suggestedAmounts[0] }
							onChange={ value => this.onSuggestedAmountChange( 0, value ) }
						/>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Mid-tier' ) }
							value={ suggestedAmounts[1] }
							onChange={ value => this.onSuggestedAmountChange( 1, value ) }
						/>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'High-tier' ) }
							value={ suggestedAmounts[2] }
							onChange={ value => this.onSuggestedAmountChange( 2, value ) }
						/>
					</div>
				) }

				{ ! tiered && (
					<div className='newspack-donations-wizard__suggested-price'>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Suggested donation amount per month' ) }
							value={ suggestedAmountUntiered }
							onChange={ value => onChange( 'suggestedAmountUntiered', value ) }
						/>
					</div>
				) }

				<div className='newspack-donations-wizard__use-tiered'>
					<ToggleControl checked={ tiered } onChange={ tiered => onChange( 'tiered', tiered ) } />
					<h4>{ __( 'Suggest low, middle, and high tiers for monthly donations' ) }</h4>
				</div>
			</Fragment>
		);
	}
}

export default withWizardScreen( DonationSettingsScreen, {} );
