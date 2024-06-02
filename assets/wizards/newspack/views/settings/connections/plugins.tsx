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

const PLUGINS: Record< string, PluginCard > = {
	jetpack: {
		slug: 'jetpack',
		path: '/newspack/v1/plugins/jetpack',
		name: __( 'Jetpack', 'newspack-plugin' ),
		editLink: 'admin.php?page=jetpack#/settings',
		description: createDescription( 'jetpack' ),
	},
	'google-site-kit': {
		slug: 'google-site-kit',
		path: '/newspack/v1/plugins/google-site-kit',
		name: __( 'Site Kit by Google', 'newspack-plugin' ),
		editLink: 'admin.php?page=googlesitekit-splash',
		description: createDescription( 'google-site-kit' ),
	},
};

function createDescription( pluginKey: string ): PluginCard[ 'description' ] {
	return ( errorMessage: string | null, isFetching: boolean, status: string | null ) => {
		if ( errorMessage ) {
			return __( 'Status: Error!', 'newspack-plugin' );
		}
		if ( isFetching ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( status === 'inactive' ) {
			return pluginKey === 'google-site-kit'
				? __( 'Status: Not connected for user', 'newspack-plugin' )
				: __( 'Status: Not connected', 'newspack-plugin' );
		}
		return __( 'Status: Connected', 'newspack-plugin' );
	};
}

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
