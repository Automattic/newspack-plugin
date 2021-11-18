/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SelectControl, TextControl, Wizard, Button } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const LocationSetup = () => {
	const wizardData = Wizard.useWizardData();
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
			<SelectControl
				label={ __( 'Where is your business based?' ) }
				value={ wizardData.location_data?.countrystate || '' }
				options={ wizardData.country_state_fields || [] }
				onChange={ changeHandler( 'countrystate' ) }
			/>
			<TextControl
				label={ __( 'Address' ) }
				value={ wizardData.location_data?.address1 || '' }
				onChange={ changeHandler( 'address1' ) }
			/>
			<TextControl
				label={ __( 'Address line 2' ) }
				value={ wizardData.location_data?.address2 || '' }
				onChange={ changeHandler( 'address2' ) }
			/>
			<TextControl
				label={ __( 'City' ) }
				value={ wizardData.location_data?.city || '' }
				onChange={ changeHandler( 'city' ) }
			/>
			<TextControl
				label={ __( 'Postcode / Zip' ) }
				value={ wizardData.location_data?.postcode || '' }
				onChange={ changeHandler( 'postcode' ) }
			/>
			<SelectControl
				label={ 'Which currency does your business use?' }
				value={ wizardData.location_data?.currency || '' }
				options={ wizardData.currency_fields || [] }
				onChange={ changeHandler( 'currency' ) }
			/>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings' ) }
				</Button>
			</div>
		</>
	);
};

export default LocationSetup;
