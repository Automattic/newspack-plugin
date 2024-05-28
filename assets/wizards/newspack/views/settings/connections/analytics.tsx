/**
 * Settings Wizard: Connections > Analytics
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WizardsPluginCard from '../../../../wizards-plugin-card';

/**
 * Analytics Plugins screen.
 */
const Analytics = ( { editLink }: { editLink: string } ) => {
	/**
	 * Render.
	 */
	return (
		<WizardsPluginCard
			plugin={ {
				pluginSlug: 'google-site-kit',
				editLink,
				name: __( 'Google Analytics', 'newspack-plugin' ),
				path: '/newspack/v1/plugins/google-site-kit',
			} }
			description={ __( 'Configure and view site analytics', 'newspack-plugin' ) }
			actionText={ __( 'View', 'newspack-plugin' ) }
			handoff="google-site-kit"
		/>
	);
};

export default Analytics;
