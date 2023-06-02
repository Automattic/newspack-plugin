/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	AutocompleteWithSuggestions,
	Button,
	Grid,
	TextControl,
	Wizard,
} from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';

const NRHSettings = () => {
	const [ selectedPage, setSelectedPage ] = useState( null );
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	const { updateWizardSettings, saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );

	useEffect( () => {
		if ( wizardData?.platform_data?.donor_landing_page ) {
			setSelectedPage( wizardData.platform_data.donor_landing_page );
		}
	}, [] );

	const changeHandler = ( key, value ) => {
		return updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'platform_data', key ],
			value,
		} );
	};
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			payloadPath: [ 'platform_data' ],
		} );

	const settings = wizardData?.platform_data || {};

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
			<div>
				<Grid columns={ 3 }>
					<TextControl
						label={ __( 'Organization ID', 'newspack' ) }
						placeholder="exampleid"
						value={ settings?.nrh_organization_id || '' }
						onChange={ value => changeHandler( 'nrh_organization_id', value ) }
					/>
					<TextControl
						label={ __( 'Custom domain (optional)', 'newspack' ) }
						help={ __( 'Enter the raw domain without protocol or slashes.' ) }
						placeholder="donate.example.com"
						value={ settings?.nrh_custom_domain || '' }
						onChange={ value => changeHandler( 'nrh_custom_domain', value ) }
					/>
					<TextControl
						label={ __( 'Salesforce Campaign ID (optional)', 'newspack' ) }
						placeholder="exampleid"
						value={ settings?.nrh_salesforce_campaign_id || '' }
						onChange={ value => changeHandler( 'nrh_salesforce_campaign_id', value ) }
					/>
				</Grid>
			</div>
			{ settings.hasOwnProperty( 'donor_landing_page' ) && (
				<div>
					<hr />
					<h3>{ __( 'Donor Landing Page', 'newspack' ) }</h3>
					<p className="components-base-control__help">
						{ __(
							'Set a page on your site as a donor landing page. Once a reader donates and lands on this page, they will be considered a donor.',
							'newspack'
						) }
					</p>
					<AutocompleteWithSuggestions
						label={ __( 'Search for a New Donor Landing Page', 'newspack' ) }
						help={ __(
							'Begin typing page title, click autocomplete result to select.',
							'newspack'
						) }
						onChange={ items => {
							if ( ! items || ! items.length ) {
								setSelectedPage( null );
								return changeHandler( 'donor_landing_page', null );
							}
							const item = items[ 0 ];
							setSelectedPage( item );
							return changeHandler( 'donor_landing_page', item );
						} }
						postTypes={ [ { slug: 'page', label: 'Page' } ] }
						postTypeLabel={ __( 'page', 'newspack' ) }
						postTypeLabelPlural={ __( 'pages', 'newspack' ) }
						selectedItems={ selectedPage ? [ selectedPage ] : [] }
					/>
				</div>
			) }
		</ActionCard>
	);
};

export default NRHSettings;
