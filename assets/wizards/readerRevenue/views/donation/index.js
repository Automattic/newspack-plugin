/**
 * WordPress dependencies.
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { MoneyInput } from '../../components/';
import { Button, Card, Grid, Notice, SectionHeader, Wizard } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

export const DonationAmounts = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	const {
		suggestedAmounts = [ 0, 0, 0 ],
		suggestedAmountUntiered = 0,
		currencySymbol = '$',
		tiered = false,
	} = wizardData.donation_data || {};
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = path => value =>
		updateWizardSettings( {
			slug: 'newspack-reader-revenue-wizard',
			path: [ 'donation_data', ...path ],
			value,
		} );

	return (
		<>
			<SectionHeader
				title={ __( 'Suggested Donations', 'newspack' ) }
				description={ __(
					'Set suggested monthly donation amounts. The one-time and annual suggested donation amount will be adjusted according to the monthly amount.',
					'newspack'
				) }
			/>
			<Grid columns={ 1 } gutter={ 16 }>
				<ToggleControl
					label={ __( 'Set exact monthly donation tiers' ) }
					checked={ tiered }
					onChange={ changeHandler( [ 'tiered' ] ) }
				/>
				{ tiered ? (
					<Grid columns={ 3 } rowGap={ 16 }>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Low-tier' ) }
							value={ suggestedAmounts[ 0 ] }
							onChange={ changeHandler( [ 'suggestedAmounts', 0 ] ) }
						/>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'Mid-tier' ) }
							value={ suggestedAmounts[ 1 ] }
							onChange={ changeHandler( [ 'suggestedAmounts', 1 ] ) }
						/>
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ __( 'High-tier' ) }
							value={ suggestedAmounts[ 2 ] }
							onChange={ changeHandler( [ 'suggestedAmounts', 2 ] ) }
						/>
					</Grid>
				) : (
					<MoneyInput
						currencySymbol={ currencySymbol }
						label={ __( 'Suggested donation amount per month' ) }
						value={ suggestedAmountUntiered }
						onChange={ changeHandler( [ 'suggestedAmountUntiered' ] ) }
					/>
				) }
			</Grid>
		</>
	);
};

const Donation = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'donations',
			payloadPath: [ 'donation_data' ],
		} );

	return (
		<>
			{ wizardData.donation_page && (
				<>
					<Card noBorder headerActions>
						<h2>{ __( 'Donations Landing Page', 'newspack' ) }</h2>
						<Button variant="secondary" isSmall href={ wizardData.donation_page.editUrl }>
							{ __( 'Edit Page' ) }
						</Button>
					</Card>
					{ 'publish' === wizardData.donation_page.status ? (
						<Notice
							isSuccess
							noticeText={ __(
								'Your donations landing page is set up and published.',
								'newspack'
							) }
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
				</>
			) }
			<DonationAmounts />
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ onSave }>
					{ __( 'Save Settings' ) }
				</Button>
			</div>
		</>
	);
};

export default Donation;
