/**
 * Settings Wizard: Connections > Plugins
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../../../../../components/src';
import WizardsActionCard from '../../../../wizards-action-card';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

const PLUGINS: Record< string, PluginCard > = {
	jetpack: {
		pluginSlug: 'jetpack',
		editLink: 'admin.php?page=jetpack#/settings',
		name: __( 'Jetpack', 'newspack-plugin' ),
		path: '/newspack/v1/plugins/jetpack',
	},
	'google-site-kit': {
		pluginSlug: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-splash',
		name: __( 'Site Kit by Google', 'newspack-plugin' ),
		path: '/newspack/v1/plugins/google-site-kitf',
	},
};

function PluginConnectButton( { plugin }: { plugin: PluginCard } ) {
	if ( plugin.pluginSlug ) {
		return <a href={ plugin.editLink }>{ __( 'Connect', 'newspack-plugin' ) }</a>;
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
	return null;
}

function Plugin( { plugin }: { plugin: PluginCard } ) {
	const { wizardApiFetch, isFetching, errorMessage } = useWizardApiFetch(
		`/newspack-settings/connections/plugins/${ plugin.pluginSlug }`
	);
	const [ status, setStatus ] = useState( 'inactive' );

	useEffect( () => {
		wizardApiFetch< null | { Status: string; Configured: boolean } >(
			{ path: plugin.path },
			{
				onSuccess( result ) {
					if ( result ) {
						setStatus( result.Configured ? result.Status : 'inactive' );
					}
				},
			}
		);
	}, [] );

	function getDescription() {
		if ( errorMessage ) {
			return __( 'Error!', 'newspack-plugin' );
		}
		if ( isFetching ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		if ( status === 'inactive' ) {
			if ( plugin.pluginSlug === 'google-site-kit' ) {
				return __( 'Not connected for this user', 'newspack-plugin' );
			}
			return __( 'Not connected', 'newspack-plugin' );
		}
		return __( 'Connected', 'newspack-plugin' );
	}

	return (
		<>
			{ /* <pre>{ JSON.stringify( { isFetching }, null, 2 ) }</pre> */ }
			<WizardsActionCard
				title={ plugin.name }
				description={ getDescription() }
				actionText={ status === 'inactive' ? <PluginConnectButton plugin={ plugin } /> : null }
				isChecked={ ! ( status === 'inactive' || isFetching ) }
				badge={ plugin.badge }
				indent={ plugin.indent }
				error={ errorMessage }
				isMedium
			/>
		</>
	);
}

function Plugins() {
	return (
		<Fragment>
			{ Object.keys( PLUGINS ).map( pluginKey => {
				return <Plugin key={ pluginKey } plugin={ PLUGINS[ pluginKey ] } />;
			} ) }
		</Fragment>
	);
}

export default Plugins;
