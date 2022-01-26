/**
 * WordPress dependencies.
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { MoneyInput } from '../../components/';
import { Card, Grid, Button, Notice, ToggleControl, Wizard } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

export const DontationAmounts = ( { data = {} } ) => {
	const {
		suggestedAmounts = [ 0, 0, 0 ],
		suggestedAmountUntiered = 0,
		currencySymbol = '$',
		tiered = false,
	} = data;
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = path => value =>
		updateWizardSettings( {
			slug: 'newspack-reader-revenue-wizard',
			path: [ 'donation_data', ...path ],
			value,
		} );

	return (
		<>
			<h2>{ __( 'Suggested donations' ) }</h2>
			<p>
				{ __(
					'Set suggested monthly donation amounts. The one-time and annual suggested donation amount will be adjusted according to the monthly amount.'
				) }
			</p>
			<ToggleControl
				label={ __( 'Set exact monthly donation tiers' ) }
				checked={ tiered }
				onChange={ changeHandler( [ 'tiered' ] ) }
			/>
			{ tiered ? (
				<Grid columns={ 3 } gutter={ 8 }>
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
		</>
	);
};

const Donation = () => {
	const wizardData = Wizard.useWizardData();

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'donations',
			payloadPath: [ 'donation_data' ],
		} );

	return (
		<>
			<Grid>
				{ wizardData.donation_page && (
					<Card noBorder>
						<h2>{ __( 'Donations landing page' ) }</h2>
						{ 'publish' === wizardData.donation_page.status ? (
							<Notice
								isSuccess
								noticeText={ __( 'Your donations landing page is set up and published.' ) }
							/>
						) : (
							<Notice
								isError
								noticeText={ __(
									"Your donations landing page has been created, but is not yet published. You can now edit it and publish when you're ready."
								) }
							/>
						) }
						<Button isSecondary href={ wizardData.donation_page.editUrl }>
							{ __( 'Edit Page' ) }
						</Button>
					</Card>
				) }
				<Card noBorder>
					<DontationAmounts data={ wizardData.donation_data } />
				</Card>
			</Grid>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings' ) }
				</Button>
			</div>
		</>
	);
};

export default Donation;
