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

function description( errorMessage: string | null, isFetching: boolean, status: string ) {
	if ( errorMessage ) {
		return __( 'Status: Error!', 'newspack-plugin' );
	}
	if ( isFetching ) {
		return __( 'Loading…', 'newspack-plugin' );
	}
	if ( status === 'inactive' ) {
		return __( 'Status: Not connected for this user', 'newspack-plugin' );
	}
	return __( 'Status: Connected', 'newspack-plugin' );
}

const PLUGINS: Record< string, PluginCard > = {
	jetpack: {
		slug: 'jetpack',
		path: '/newspack/v1/plugins/jetpack',
		name: __( 'Jetpack', 'newspack-plugin' ),
		editLink: 'admin.php?page=jetpack#/settings',
		description( errorMessage: string | null, isFetching: boolean, status: string ) {
			if ( errorMessage ) {
				return __( 'Status: Error!', 'newspack-plugin' );
			}
			if ( isFetching ) {
				return __( 'Loading…', 'newspack-plugin' );
			}
			if ( status === 'inactive' ) {
				return __( 'Status: Not connected', 'newspack-plugin' );
			}
			return __( 'Status: Connected', 'newspack-plugin' );
		},
	},
	'google-site-kit': {
		slug: 'google-site-kit',
		path: '/newspack/v1/plugins/google-site-kit',
		name: __( 'Site Kit by Google', 'newspack-plugin' ),
		editLink: 'admin.php?page=googlesitekit-splash',
		description( errorMessage: string | null, isFetching: boolean, status: string ) {
			if ( errorMessage ) {
				return __( 'Status: Error!', 'newspack-plugin' );
			}
			if ( isFetching ) {
				return __( 'Loading…', 'newspack-plugin' );
			}
			if ( status === 'inactive' ) {
				return __( 'Status: Not connected for this user', 'newspack-plugin' );
			}
			return __( 'Status: Connected', 'newspack-plugin' );
		},
	},
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
