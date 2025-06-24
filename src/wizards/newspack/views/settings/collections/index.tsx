/**
 * Settings Collections: Global settings for Collections module.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsActionCard from '../../../../wizards-action-card';
import useWizardApiFetchToggle from '../../../../hooks/use-wizard-api-fetch-toggle';
import { TextControl, Button, Grid } from '../../../../../components/src';
import CustomNamingCard from './custom-naming-card';

// Default values for collections settings
const DEFAULT_COLLECTIONS_SETTINGS: CollectionsSettingsData = {
	custom_naming_enabled: false,
	custom_name: '',
	custom_singular_name: '',
	custom_slug: '',
	subscribe_link: '',
};

// Helper function to extract collection settings from API data with defaults.
const extractCollectionSettings = ( apiData: Partial< CollectionsSettingsData > ): CollectionsSettingsData => ( {
	...DEFAULT_COLLECTIONS_SETTINGS,
	...apiData,
} );

/**
 * Collections settings component.
 */
function Collections() {
	const { description, apiData, isFetching, actionText, apiFetchToggle, errorMessage } = useWizardApiFetchToggle<
		CollectionsSettingsData & { module_enabled_collections: boolean }
	>( {
		path: '/newspack/v1/wizard/newspack-settings/collections',
		apiNamespace: 'newspack-settings/collections',
		data: {
			...DEFAULT_COLLECTIONS_SETTINGS,
			module_enabled_collections: false,
		},
		description: __( 'Manage print editions and other collections of content with custom ordering and organization.', 'newspack-plugin' ),
	} );

	const [ settings, setSettings ] = useState< Partial< CollectionsSettingsData > >( DEFAULT_COLLECTIONS_SETTINGS );

	// Sync local state from apiData when it changes.
	useEffect( () => {
		setSettings( extractCollectionSettings( apiData ) );
	}, [ apiData ] );

	const [ isSavingSettings, setIsSavingSettings ] = useState( false );

	// Set isSavingSettings to false when isFetching transitions to false after a save.
	useEffect( () => {
		if ( ! isFetching ) {
			setIsSavingSettings( false );
		}
	}, [ isFetching ] );

	const handleSaveSettings = () => {
		setIsSavingSettings( true );
		apiFetchToggle( { ...apiData, ...settings }, true );
	};

	const updateSetting: FieldChangeHandler< CollectionsSettingsData > = ( key, value ) => {
		setSettings( prev => ( { ...prev, [ key ]: value } ) );
	};

	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Collections Settings', 'newspack-plugin' ) }</h1>

			<WizardsActionCard
				isMedium
				title={ __( 'Collections Module', 'newspack-plugin' ) }
				description={ description }
				disabled={ isFetching }
				actionText={ actionText }
				error={ errorMessage }
				toggleChecked={ apiData.module_enabled_collections }
				toggleOnChange={ ( value: boolean ) => apiFetchToggle( { ...apiData, module_enabled_collections: value }, true ) }
			/>

			{ apiData.module_enabled_collections && (
				<>
					<CustomNamingCard settings={ settings } isSaving={ isSavingSettings } onChange={ updateSetting } />

					<Grid columns={ 1 } gutter={ 32 }>
						<TextControl
							label={ __( 'Subscription URL', 'newspack-plugin' ) }
							help={ __( 'Global URL where readers can subscribe to collections.', 'newspack-plugin' ) }
							value={ settings.subscribe_link }
							onChange={ ( value: string ) => updateSetting( 'subscribe_link', value ) }
							placeholder={ `e.g., https://${ window.location.hostname }/subscribe` }
						/>
					</Grid>

					<div className="newspack-buttons-card">
						<Button variant="primary" onClick={ handleSaveSettings } disabled={ isSavingSettings }>
							{ isSavingSettings ? __( 'Saving…', 'newspack-plugin' ) : __( 'Save Settings', 'newspack-plugin' ) }
						</Button>
					</div>
				</>
			) }
		</div>
	);
}

export default Collections;
