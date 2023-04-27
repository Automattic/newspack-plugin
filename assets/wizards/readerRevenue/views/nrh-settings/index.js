/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Grid, TextControl, Wizard } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const NRHSettings = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
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
		<ActionCard
			hasGreyHeader
			isMedium
			title={ __( 'News Revenue Hub Settings', 'newspack' ) }
			description={ __( 'Configure your site’s connection to News Revenue Hub.', 'newspack' ) }
			actionContent={
				<Button isPrimary onClick={ onSave }>
					{ __( 'Save Settings' ) }
				</Button>
			}
		>
			<Grid columns={ 3 }>
				<TextControl
					label={ __( 'Organization ID', 'newspack' ) }
					placeholder="exampleid"
					value={ wizardData.platform_data?.nrh_organization_id || '' }
					onChange={ changeHandler( 'nrh_organization_id' ) }
				/>
				<TextControl
					label={ __( 'Custom domain (optional)', 'newspack' ) }
					help={ __( 'Enter the raw domain without protocol or slashes.' ) }
					placeholder="example.fundjournalism.org"
					value={ wizardData.platform_data?.nrh_custom_domain || '' }
					onChange={ changeHandler( 'nrh_custom_domain' ) }
				/>
				<TextControl
					label={ __( 'Salesforce Campaign ID (optional)', 'newspack' ) }
					placeholder="exampleid"
					value={ wizardData.platform_data?.nrh_salesforce_campaign_id || '' }
					onChange={ changeHandler( 'nrh_salesforce_campaign_id' ) }
				/>
			</Grid>
		</ActionCard>
	);
};

export default NRHSettings;
