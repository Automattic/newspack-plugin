/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WizardsActionCard from '../../../../wizards-action-card';

function Rss() {
	return (
		<WizardsActionCard
			title={ __( 'RSS Enhancements', 'newspack' ) }
			description={ __(
				'Create and manage customized RSS feeds for syndication partners',
				'newspack'
			) }
			toggleChecked={ false /* Boolean( settingsData.module_enabled_rss) */ }
			toggleOnChange={ ( value: any ) => {
				// saveWizardSettings( {
				// 	slug: 'newspack-settings-wizard',
				// 	updatePayload: {
				// 		path: [ 'module_enabled_rss' ],
				// 		value,
				// 	},
				// } ).then( () => {
				// 	window.location.reload( true );
				// } );
			} }
		/>
	);
}

export default Rss;
