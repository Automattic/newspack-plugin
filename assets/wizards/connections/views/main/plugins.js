/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Handoff, hooks } from '../../../../components/src';

const PLUGINS = {
	jetpack: {
		pluginSlug: 'jetpack',
		editLink: 'admin.php?page=jetpack#/settings',
		name: 'Jetpack',
		fetchStatus: () =>
			apiFetch( { path: `/newspack/v1/plugins/jetpack` } ).then( result => ( {
				jetpack: { status: result.Configured ? result.Status : 'inactive' },
			} ) ),
	},
	'google-site-kit': {
		pluginSlug: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-splash',
		name: __( 'Site Kit by Google', 'newspack' ),
		fetchStatus: () =>
			apiFetch( { path: '/newspack/v1/plugins/google-site-kit' } ).then( result => ( {
				'google-site-kit': { status: result.Configured ? result.Status : 'inactive' },
			} ) ),
	},
};

const pluginConnectButton = plugin => {
	if ( plugin.pluginSlug ) {
		return (
			<Handoff plugin={ plugin.pluginSlug } editLink={ plugin.editLink } compact isLink>
				{ __( 'Connect', 'newspack' ) }
			</Handoff>
		);
	}
	if ( plugin.url ) {
		return (
			<Button isLink href={ plugin.url } target="_blank">
				{ __( 'Connect', 'newspack' ) }
			</Button>
		);
	}
	if ( plugin.error?.code === 'unavailable_site_id' ) {
		return (
			<span className="i newspack-error">{ __( 'Jetpack connection required', 'newspack' ) }</span>
		);
	}
};

const Plugins = ( { setError } ) => {
	const [ plugins, setPlugins ] = hooks.useObjectState( PLUGINS );
	const pluginsArray = Object.values( plugins );
	useEffect( () => {
		pluginsArray.forEach( async plugin => {
			const update = await plugin.fetchStatus().catch( setError );
			setPlugins( update );
		} );
	}, [] );

	return (
		<>
			{ pluginsArray.map( plugin => {
				const isInactive = plugin.status === 'inactive';
				const isLoading = ! plugin.status;
				const getDescription = () => {
					if ( isLoading ) {
						return __( 'Loading…', 'newspack' );
					}
					if ( isInactive ) {
						if ( plugin.pluginSlug === 'google-site-kit' ) {
							return __( 'Not connected for this user', 'newspack' );
						}
						return __( 'Not connected', 'newspack' );
					}
					return __( 'Connected', 'newspack' );
				};
				return (
					<ActionCard
						key={ plugin.name }
						title={ plugin.name }
						description={ `${ __( 'Status:', 'newspack' ) } ${ getDescription() }` }
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
