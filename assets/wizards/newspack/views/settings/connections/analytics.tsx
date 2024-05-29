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
			{ ...{
				slug: 'google-site-kit',
				editLink,
				name: __( 'Google Analytics', 'newspack-plugin' ),
				path: '/newspack/v1/plugins/google-site-kit',
				description( errorMessage, isFetching, status ) {
					if ( errorMessage ) {
						return __( 'Error!', 'newspack-plugin' );
					}
					if ( isFetching ) {
						return __( 'Loading…', 'newspack-plugin' );
					}
					if ( status === 'inactive' ) {
						return __( 'Not connected', 'newspack-plugin' );
					}
					return __( 'Connected', 'newspack-plugin' );
				},
				actionText: __( 'View', 'newspack-plugin' ),
			} }
		/>
	);
};

export default Analytics;
