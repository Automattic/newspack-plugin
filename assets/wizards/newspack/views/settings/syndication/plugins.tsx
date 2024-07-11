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
import WizardsPluginCard from '../../../../wizards-plugin-card';

const PLUGINS: Record< string, PluginCard & { isConfigurable: boolean; isTogglable: boolean } > = {
	'publish-to-apple-news': {
		slug: 'publish-to-apple-news',
		title: __( 'Apple News', 'newspack-plugin' ),
		editLink: 'admin.php?page=apple_news_index',
		isConfigurable: true,
		isTogglable: true,
		// actionText: __( 'Configure', 'newspack-plugin' ),
		description: __( 'Export and synchronize posts to Apple format', 'newspack-plugin' ),
	},
	// distributor: {
	// 	slug: 'distributor',
	// 	title: __( 'Distributor', 'newspack-plugin' ),
	// 	editLink: 'admin.php?page=googlesitekit-splash',
	// 	actionText: __( 'Configure', 'newspack-plugin' ),
	// 	description( _, isFetching ) {
	// 		if ( isFetching ) {
	// 			return __( 'Loading…', 'newspack-plugin' );
	// 		}
	// 		return __(
	// 			'Distributor is a WordPress plugin that makes it easy to syndicate and reuse content across your websites — whether in a single multisite or across the web.',
	// 			'newspack-plugin'
	// 		);
	// 	},
	// },
};

function Plugins() {
	return (
		<Fragment>
			{ Object.keys( PLUGINS ).map( pluginKey => {
				return <WizardsPluginCard key={ pluginKey } { ...PLUGINS[ pluginKey ] } />;
			} ) }
		</Fragment>
	);
}

export default Plugins;
