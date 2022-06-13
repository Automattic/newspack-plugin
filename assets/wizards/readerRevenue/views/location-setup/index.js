/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Grid, SelectControl, TextControl, Wizard } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const LocationSetup = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	const { updateWizardSettings, saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );

	const changeHandler = key => value =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'location_data', key ],
			value,
		} );

	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'location',
			payloadPath: [ 'location_data' ],
		} );

	return (
		<>
			<Grid columns={ 1 } gutter={ 16 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<TextControl
						label={ __( 'Address', 'newspack' ) }
						value={ wizardData.location_data?.address1 || '' }
						onChange={ changeHandler( 'address1' ) }
					/>
					<TextControl
						label={ __( 'Address line 2', 'newspack' ) }
						value={ wizardData.location_data?.address2 || '' }
						onChange={ changeHandler( 'address2' ) }
					/>
				</Grid>
				<Grid rowGap={ 16 }>
					<TextControl
						label={ __( 'City', 'newspack' ) }
						value={ wizardData.location_data?.city || '' }
						onChange={ changeHandler( 'city' ) }
					/>
					<TextControl
						label={ __( 'Postcode / Zip', 'newspack' ) }
						value={ wizardData.location_data?.postcode || '' }
						onChange={ changeHandler( 'postcode' ) }
					/>
					<SelectControl
						label={ __( 'Country', 'newspack' ) }
						value={ wizardData.location_data?.countrystate || '' }
						options={ wizardData.country_state_fields || [] }
						onChange={ changeHandler( 'countrystate' ) }
					/>
					<SelectControl
						label={ __( 'Currency', 'newspack' ) }
						value={ wizardData.location_data?.currency || '' }
						options={ wizardData.currency_fields || [] }
						onChange={ changeHandler( 'currency' ) }
					/>
				</Grid>
			</Grid>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings' ) }
				</Button>
			</div>
		</>
	);
};

export default LocationSetup;
