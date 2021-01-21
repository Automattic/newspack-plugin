/**
 * Donation Settings Screen
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { MoneyInput } from '../../components/';
import {
	Card,
	Grid,
	Handoff,
	Notice,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';

/**
 * Donation Settings Screen Component
 */
class Donation extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange, donationPage } = this.props;
		const {
			suggestedAmounts = [ 0, 0, 0 ],
			suggestedAmountUntiered = 0,
			currencySymbol = '$',
			tiered = false,
		} = data;
		return (
			<Grid>
				{ donationPage && (
					<Card noBorder>
						<h2>{ __( 'Donations landing page' ) }</h2>
						{ 'publish' !== donationPage.status && (
							<Notice
								isError
								noticeText={ __(
									"Your donations landing page has been created, but is not yet published. You can now edit it and publish when you're ready."
								) }
							/>
						) }
						{ 'publish' === donationPage.status && (
							<Notice
								isSuccess
								noticeText={ __( 'Your donations landing page is set up and published.' ) }
							/>
						) }
						<Handoff
							plugin="woocommerce"
							editLink={ donationPage.editUrl }
							isTertiary
							isSmall
							showOnBlockEditor
						>
							{ __( 'Edit Page' ) }
						</Handoff>
					</Card>
				) }
				<Card noBorder>
					<h2>{ __( 'Suggested donations' ) }</h2>
					<p>
						{ __(
							'Set a suggested monthly donation amount. This will provide hints to readers about how much to donate, which will increase the average donation amount.'
						) }
					</p>
					<ToggleControl
						label={ __( 'Suggest low, middle, and high tiers for monthly donations' ) }
						checked={ tiered }
						onChange={ _tiered => onChange( { ...data, tiered: _tiered } ) }
					/>
					{ tiered && (
						<Grid columns={ 3 } gutter={ 8 }>
							<MoneyInput
								currencySymbol={ currencySymbol }
								label={ __( 'Low-tier' ) }
								value={ suggestedAmounts[ 0 ] }
								onChange={ value =>
									onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 0: value } } )
								}
							/>
							<MoneyInput
								currencySymbol={ currencySymbol }
								label={ __( 'Mid-tier' ) }
								value={ suggestedAmounts[ 1 ] }
								onChange={ value =>
									onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 1: value } } )
								}
							/>
							<MoneyInput
								currencySymbol={ currencySymbol }
								label={ __( 'High-tier' ) }
								value={ suggestedAmounts[ 2 ] }
								onChange={ value =>
									onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 2: value } } )
								}
							/>
						</Grid>
					) }
					{ ! tiered && (
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Suggested donation amount per month' ) }
							value={ suggestedAmountUntiered }
							onChange={ _suggestedAmountUntiered =>
								onChange( { ...data, suggestedAmountUntiered: _suggestedAmountUntiered } )
							}
						/>
					) }
				</Card>
			</Grid>
		);
	}
}

Donation.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( Donation );
