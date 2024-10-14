/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { PluginToggle, ActionCard, Wizard } from '../../../../components/src';

const Intro = () => {
	const settingsData = Wizard.useWizardData( 'settings' );
	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	return (
		<>
			<ActionCard
				title={ __( 'RSS Enhancements', 'newspack' ) }
				description={ __(
					'Create and manage customized RSS feeds for syndication partners',
					'newspack'
				) }
				toggleChecked={ Boolean( settingsData.module_enabled_rss ) }
				toggleOnChange={ value => {
					saveWizardSettings( {
						slug: 'newspack-settings-wizard',
						updatePayload: {
							path: [ 'module_enabled_rss' ],
							value,
						},
					} ).then( () => {
						window.location.reload( true );
					} );
				} }
			/>
			<PluginToggle
				plugins={ {
					'publish-to-apple-news': {
						name: __( 'Apple News', 'newspack' ),
					},
					distributor: {
						name: __( 'Distributor', 'newspack' ),
					},
				} }
			/>
		</>
	);
};

export default Intro;
