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
function Analytics( { editLink }: { editLink?: string } ) {
	/**
	 * Render.
	 */
	return (
		<WizardsPluginCard
			{ ...{
				editLink,
				slug: 'google-site-kit',
				name: __( 'Google Analytics', 'newspack-plugin' ),
				path: '/newspack/v1/plugins/google-site-kit',
				actionText: __( 'View', 'newspack-plugin' ),
			} }
		/>
	);
}

export default Analytics;
