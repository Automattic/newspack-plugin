/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Handoff, hooks } from '@components';

interface PluginStatusResponse {
	Configured: boolean;
	Status: string;
}

interface Plugin {
	pluginSlug?: string;
	editLink?: string;
	name: string;
	url?: string;
	error?: {
		code: string;
	};
	fetchStatus: () => Promise< { [ key: string ]: { status: string } } >;
}

const PLUGINS: Record< string, Plugin > = {
	jetpack: {
		pluginSlug: 'jetpack',
		editLink: 'admin.php?page=jetpack#/settings',
		name: 'Jetpack',
		fetchStatus: () =>
			apiFetch< PluginStatusResponse >( { path: `/newspack/v1/plugins/jetpack` } ).then(
				result => ( {
					jetpack: { status: result.Configured ? result.Status : 'inactive' },
				} )
			),
	},
	'google-site-kit': {
		pluginSlug: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-splash',
		name: __( 'Site Kit by Google', 'newspack-plugin' ),
		fetchStatus: () =>
			apiFetch< PluginStatusResponse >( { path: '/newspack/v1/plugins/google-site-kit' } ).then(
				result => ( {
					'google-site-kit': { status: result.Configured ? result.Status : 'inactive' },
				} )
			),
	},
};

const pluginConnectButton = ( plugin: Plugin ) => {
	if ( plugin.pluginSlug ) {
		return (
			<Handoff plugin={ plugin.pluginSlug } editLink={ plugin.editLink } compact isLink>
				{ __( 'Connect', 'newspack-plugin' ) }
			</Handoff>
		);
	}
	if ( plugin.url ) {
		return (
			<Button isLink href={ plugin.url } target="_blank">
				{ __( 'Connect', 'newspack-plugin' ) }
			</Button>
		);
	}
	if ( plugin.error?.code === 'unavailable_site_id' ) {
		return (
			<span className="i newspack-error">
				{ __( 'Jetpack connection required', 'newspack-plugin' ) }
			</span>
		);
	}
};

interface PluginsProps {
	setError?: SetErrorCallback;
}

interface PluginStatus {
	status: string;
}

interface PluginsState {
	[ key: string ]: Plugin & PluginStatus;
}

const Plugins = ( { setError }: PluginsProps ) => {
	const [ plugins, setPlugins ] = hooks.useObjectState( PLUGINS ) as any;
	const pluginsArray = Object.values( plugins );
	useEffect( () => {
		pluginsArray.forEach( async ( plugin: any ) => {
			const update = await plugin.fetchStatus().catch( setError );
			setPlugins( update );
		} );
	}, [] );

	return (
		<>
			{ pluginsArray.map( ( plugin: any ) => {
				const isInactive = plugin.status === 'inactive';
				const isLoading = ! plugin.status;
				const getDescription = () => {
					if ( isLoading ) {
						return __( 'Loading…', 'newspack-plugin' );
					}
					if ( isInactive ) {
						if ( plugin.pluginSlug === 'google-site-kit' ) {
							return __( 'Not connected for this user', 'newspack-plugin' );
						}
						return __( 'Not connected', 'newspack-plugin' );
					}
					return __( 'Connected', 'newspack-plugin' );
				};
				return (
					<ActionCard
						key={ plugin.name }
						title={ plugin.name }
						description={ `${ __( 'Status:', 'newspack-plugin' ) } ${ getDescription() }` }
						actionText={ isInactive ? pluginConnectButton( plugin ) : null }
						checkbox={ isInactive || isLoading ? 'unchecked' : 'checked' }
						badge={ plugin.badge }
						indent={ plugin.indent }
						isMedium
					/>
				);
			} ) }
		</>
	);
};

export default Plugins;
