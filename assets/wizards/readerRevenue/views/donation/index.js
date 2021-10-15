/**
 * Donation Settings Screen
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { MoneyInput } from '../../components/';
import {
	Card,
	Grid,
	Button,
	Notice,
	SectionHeader,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';

export const DontationAmounts = ( { data, onChange } ) => {
	const {
		suggestedAmounts = [ 0, 0, 0 ],
		suggestedAmountUntiered = 0,
		currencySymbol = '$',
		tiered = false,
	} = data;

	return (
		<div>
			<SectionHeader
				title={ __( 'Suggested Donations' ) }
				description={ () => (
					<>
						{ __( 'Set suggested monthly donation amounts', 'newspack' ) }
						<br />
						{ __(
							'The one-time and annual suggested donation amount will be adjusted according to the monthly amount',
							'newspack'
						) }
					</>
				) }
			/>
			<Grid columns={ 1 } gutter={ 16 }>
				<ToggleControl
					label={ __( 'Set exact monthly donation tiers' ) }
					checked={ tiered }
					onChange={ _tiered => onChange( { ...data, tiered: _tiered } ) }
				/>
				{ tiered ? (
					<Grid columns={ 3 } gutter={ 8 }>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Low-tier', 'newspack' ) }
							value={ suggestedAmounts[ 0 ] }
							onChange={ value =>
								onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 0: value } } )
							}
						/>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Mid-tier', 'newspack' ) }
							value={ suggestedAmounts[ 1 ] }
							onChange={ value =>
								onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 1: value } } )
							}
						/>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'High-tier', 'newspack' ) }
							value={ suggestedAmounts[ 2 ] }
							onChange={ value =>
								onChange( { ...data, suggestedAmounts: { ...suggestedAmounts, 2: value } } )
							}
						/>
					</Grid>
				) : (
					<MoneyInput
						currencySymbol={ currencySymbol }
						label={ __( 'Amount', 'newspack' ) }
						value={ suggestedAmountUntiered }
						onChange={ _suggestedAmountUntiered =>
							onChange( { ...data, suggestedAmountUntiered: _suggestedAmountUntiered } )
						}
					/>
				) }
			</Grid>
		</div>
	);
};

/**
 * Donation Settings Screen Component
 */
const Donation = ( { data = {}, onChange = () => null, donationPage } ) => (
	<Grid>
		{ donationPage && (
			<Card noBorder>
				<Card headerActions noBorder>
					<h2>{ __( 'Donations Landing Page', 'newspack' ) }</h2>
					<Button isSecondary isSmall href={ donationPage.editUrl }>
						{ __( 'Edit Page', 'newspack' ) }
					</Button>
				</Card>
				{ 'publish' === donationPage.status ? (
					<Notice
						isSuccess
						noticeText={ __( 'Your donations landing page is set up and published.', 'newspack' ) }
					/>
				) : (
					<Notice
						isError
						noticeText={ __(
							"Your donations landing page has been created, but is not yet published. You can now edit it and publish when you're ready.",
							'newspack'
						) }
					/>
				) }
			</Card>
		) }
		<DontationAmounts data={ data } onChange={ onChange } />
	</Grid>
);

export default withWizardScreen( Donation );
