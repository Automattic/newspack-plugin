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
import {
	Button,
	Card,
	Notice,
	SectionHeader,
	Wizard,
	ActionCard,
} from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

type FrequencySlug = 'once' | 'month' | 'year';

const FREQUENCIES: {
	[ Key in FrequencySlug as string ]: { tieredLabel: string; staticLabel: string };
} = {
	once: {
		tieredLabel: __( 'One-time donations' ),
		staticLabel: __( 'Suggested one-time donation amount' ),
	},
	month: {
		tieredLabel: __( 'Monthly donations' ),
		staticLabel: __( 'Suggested donation amount per month' ),
	},
	year: {
		tieredLabel: __( 'Annual donations' ),
		staticLabel: __( 'Suggested donation amount per year' ),
	},
};
const FREQUENCY_SLUGS: FrequencySlug[] = Object.keys( FREQUENCIES ) as FrequencySlug[];

type WizardData = {
	donation_data:
		| { errors: { [ key: string ]: string[] } }
		| {
				amounts: {
					[ Key in FrequencySlug as string ]: [ number, number, number, number ];
				};
				disabledFrequencies: {
					[ Key in FrequencySlug as string ]: boolean;
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
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );

	if ( ! wizardData.donation_data || 'errors' in wizardData.donation_data ) {
		return null;
	}

	const { amounts, currencySymbol, tiered, disabledFrequencies } = wizardData.donation_data;

	const changeHandler = path => value =>
		updateWizardSettings( {
			slug: 'newspack-reader-revenue-wizard',
			path: [ 'donation_data', ...path ],
			value,
		} );

	const availableFrequencies = FREQUENCY_SLUGS.map( slug => ( {
		key: slug,
		...FREQUENCIES[ slug ],
	} ) );

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
				availableFrequencies.map( section => {
					const isFrequencyDisabled = disabledFrequencies[ section.key ];
					const isOneFrequencyActive =
						Object.values( disabledFrequencies ).filter( Boolean ).length ===
						FREQUENCY_SLUGS.length - 1;
					return (
						<ActionCard
							key={ section.key }
							toggleChecked={ ! isFrequencyDisabled }
							toggleOnChange={ () =>
								changeHandler( [ 'disabledFrequencies', section.key ] )( ! isFrequencyDisabled )
							}
							title={ section.tieredLabel }
							disabled={ ! isFrequencyDisabled && isOneFrequencyActive }
						>
							{ ! isFrequencyDisabled && (
								<div className="flex-ns">
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
								</div>
							) }
						</ActionCard>
					);
				} )
			) : (
				<div className="flex-ns">
					{ availableFrequencies.map( section => (
						<MoneyInput
							currencySymbol={ currencySymbol }
							label={ section.staticLabel }
							value={ amounts[ section.key ][ 3 ] }
							onChange={ changeHandler( [ 'amounts', section.key, 3 ] ) }
							key={ section.key }
						/>
					) ) }
				</div>
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
						<Button
							variant="secondary"
							isSmall
							href={ wizardData.donation_page.editUrl }
							onClick={ undefined }
						>
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
				<Button variant="primary" onClick={ onSave } href={ undefined }>
					{ __( 'Save Settings' ) }
				</Button>
			</div>
		</>
	);
};

export default Donation;
