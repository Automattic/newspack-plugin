/**
 * WordPress dependencies.
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { MoneyInput } from '../../components';
import { Button, Card, Grid, Notice, SectionHeader, Wizard } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const settingsFrequencies = [
	{
		tieredLabel: __( 'One-time donation tiers' ),
		staticLabel: __( 'Suggested one-time donation amount' ),
		key: 'once',
	},
	{
		tieredLabel: __( 'Monthly donation tiers' ),
		staticLabel: __( 'Suggested donation amount per month' ),
		key: 'month',
	},
	{
		tieredLabel: __( 'Annual donation tiers' ),
		staticLabel: __( 'Suggested donation amount per year' ),
		key: 'year',
	},
];

type WizardData = {
	donation_data: {
		amounts: {
			once: [ number, number, number, number ];
			month: [ number, number, number, number ];
			year: [ number, number, number, number ];
		};
		currencySymbol: string;
		tiered: boolean;
	};
	donation_page: {
		editUrl: string;
		status: string;
	};
};

export const DonationAmounts = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' ) as WizardData;
	const { amounts, currencySymbol, tiered } = wizardData.donation_data || {};
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );

	if ( ! wizardData.donation_data ) {
		return null;
	}

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
					'Set suggested donation amounts. These will be the default settings for the Donate block.',
					'newspack'
				) }
			/>
			<ToggleControl
				label={ __( 'Tiered', 'newspack' ) }
				checked={ tiered }
				onChange={ changeHandler( [ 'tiered' ] ) }
			/>
			{ tiered ? (
				settingsFrequencies.map( section => (
					<Grid columns={ 1 } gutter={ 16 } key={ section.key }>
						<b>{ section.tieredLabel }</b>
						<Grid columns={ 3 } rowGap={ 16 }>
							<MoneyInput
								currencySymbol={ currencySymbol }
								label={ __( 'Low-tier' ) }
								value={ amounts[ section.key ][ 0 ] }
								onChange={ changeHandler( [ 'amounts', section.key, 0 ] ) }
							/>
							<MoneyInput
								currencySymbol={ currencySymbol }
								label={ __( 'Mid-tier' ) }
								value={ amounts[ section.key ][ 1 ] }
								onChange={ changeHandler( [ 'amounts', section.key, 1 ] ) }
							/>
							<MoneyInput
								currencySymbol={ currencySymbol }
								label={ __( 'High-tier' ) }
								value={ amounts[ section.key ][ 2 ] }
								onChange={ changeHandler( [ 'amounts', section.key, 2 ] ) }
							/>
						</Grid>
					</Grid>
				) )
			) : (
				<Grid columns={ 3 } gutter={ 16 }>
					{ settingsFrequencies.map( section => (
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ section.staticLabel }
							value={ amounts[ section.key ][ 3 ] }
							onChange={ changeHandler( [ 'amounts', section.key, 3 ] ) }
							key={ section.key }
						/>
					) ) }
				</Grid>
			) }
		</>
	);
};

const Donation = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' ) as WizardData;

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
