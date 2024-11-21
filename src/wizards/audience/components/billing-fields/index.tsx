/**
 * WordPress dependencies.
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import {
	Button,
	Card,
	Grid,
	SectionHeader,
	Wizard,
} from '../../../../components/src';

const BillingFields = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' ) as ReaderRevenueWizardData;
	const { updateWizardSettings, saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );

	if ( ! wizardData.donation_data || 'errors' in wizardData.donation_data ) {
		return null;
	}

	const changeHandler = ( path: string[] ) => ( value: any ) =>
		updateWizardSettings( {
			slug: 'newspack-reader-revenue-wizard',
			path: [ 'donation_data', ...path ],
			value,
		} );

	const onSave = () =>
		saveWizardSettings( {
			slug: 'newspack-reader-revenue-wizard',
			section: 'donations',
			payloadPath: [ 'donation_data' ],
		} );

	const availableFields = wizardData.available_billing_fields;
	if ( ! availableFields || ! Object.keys( availableFields ).length ) {
		return null;
	}

	const billingFields = wizardData.donation_data.billingFields.length
		? wizardData.donation_data.billingFields
		: Object.keys( availableFields );

	return (
		<>
			<Card noBorder headerActions>
				<SectionHeader
					title={ __( 'Checkout Billing Fields', 'newspack-plugin' ) }
					description={ __(
						'Configure the billing fields shown in the modal checkout form.',
						'newspack-plugin'
					) }
					noMargin
				/>
			</Card>
			<Grid columns={ 3 } rowGap={ 16 }>
				{ Object.keys( availableFields ).map( fieldKey => (
					<CheckboxControl
						key={ fieldKey }
						label={ availableFields[ fieldKey ].label }
						checked={ billingFields.includes( fieldKey ) }
						disabled={ fieldKey === 'billing_email' } // Email is always required.
						onChange={ () => {
							let newFields = [ ...billingFields ];
							if ( billingFields.includes( fieldKey ) ) {
								newFields = newFields.filter( field => field !== fieldKey );
							} else {
								newFields = [ ...newFields, fieldKey ];
							}
							changeHandler( [ 'billingFields' ] )( newFields );
						} }
					/>
				) ) }
			</Grid>
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ onSave }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</>
	);
};

export default BillingFields;
