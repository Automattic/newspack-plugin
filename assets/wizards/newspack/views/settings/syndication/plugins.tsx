/**
 * Settings Wizard: Connections > Plugins
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsPluginToggleCard from '../../../../wizards-plugin-toggle-card';

const PLUGINS: Record< string, PluginCard > = {
	'publish-to-apple-news': {
		slug: 'publish-to-apple-news',
		path: '/newspack/v1/plugins/publish-to-apple-news',
		name: __( 'Apple News', 'newspack-plugin' ),
		editLink: 'admin.php?page=jetpack#/settings',
		actionText: __( 'Configure', 'newspack-plugin' ),
		description( _, isFetching ) {
			if ( isFetching ) {
				return __( 'Loading…', 'newspack-plugin' );
			}
			return __( 'Export and synchronize posts to Apple format', 'newspack-plugin' );
		},
	},
	distributor: {
		slug: 'distributor',
		path: '/newspack/v1/plugins/distributor',
		name: __( 'Distributor', 'newspack-plugin' ),
		editLink: 'admin.php?page=googlesitekit-splash',
		actionText: __( 'Configure', 'newspack-plugin' ),
		description( _, isFetching ) {
			if ( isFetching ) {
				return __( 'Loading…', 'newspack-plugin' );
			}
			return __(
				'Distributor is a WordPress plugin that makes it easy to syndicate and reuse content across your websites — whether in a single multisite or across the web.',
				'newspack-plugin'
			);
		},
	},
};

function Plugins() {
	return (
		<Fragment>
			{ Object.keys( PLUGINS ).map( pluginKey => {
				return (
					<WizardsPluginToggleCard
						key={ pluginKey }
						{ ...PLUGINS[ pluginKey ] }
						activeStatus={ 'Active' }
					/>
				);
			} ) }
		</Fragment>
	);
}

export default Plugins;
