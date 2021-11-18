/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, TextControl, Wizard, Button } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const NRHSettings = () => {
	const wizardData = Wizard.useWizardData();
	const { updateWizardSettings, saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );

	const changeHandler = key => value =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'platform_data', key ],
			value,
		} );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			payloadPath: [ 'platform_data' ],
		} );

	return (
		<>
			<Grid>
				<TextControl
					label={ __( 'NRH Organization ID (required)', 'newspack' ) }
					value={ wizardData.platform_data?.nrh_organization_id || '' }
					onChange={ changeHandler( 'nrh_organization_id' ) }
				/>
				<TextControl
					label={ __( 'NRH Salesforce Campaign ID', 'newspack' ) }
					value={ wizardData.platform_data?.nrh_salesforce_campaign_id || '' }
					onChange={ changeHandler( 'nrh_salesforce_campaign_id' ) }
				/>
			</Grid>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ onSave }>
					{ __( 'Update' ) }
				</Button>
			</div>
		</>
	);
};

export default NRHSettings;
