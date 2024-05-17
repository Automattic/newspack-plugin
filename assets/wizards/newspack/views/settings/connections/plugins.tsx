/**
 * Settings Wizard: Connections > Plugins
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsActionCard from '../../../../wizards-action-card';
import { Button, Handoff, hooks } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import useWizardDataPropErrors from '../../../../hooks/use-wizard-data-prop-errors';

interface Plugin {
	path: string;
	pluginSlug: string;
	editLink: string;
	name: string;
	url?: string;
	status?: string;
	badge?: string;
	indent?: string;
	error?: {
		code: string;
	};
}

const PLUGINS: Record< string, Plugin > = {
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
		path: '/newspack/v1/plugins/google-site-kit',
	},
};

function PluginConnectButton( { plugin }: { plugin: Plugin } ) {
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
	return null;
}

const Plugins = () => {
	const [ plugins, setPlugins ] = hooks.useObjectState( PLUGINS ) as any;
	const { wizardApiFetch } = useWizardApiFetch();
	const { setError, getError } = useWizardDataPropErrors(
		'newspack/settings',
		'connections/plugins',
		Object.keys( PLUGINS )
	);

	const pluginsArray = Object.keys( PLUGINS );
	useEffect( () => {
		pluginsArray.forEach(
			async ( pluginKey: string ) =>
				await wizardApiFetch(
					{ path: PLUGINS[ pluginKey ].path },
					{
						onSuccess( result: any ) {
							setPlugins( {
								[ pluginKey ]: { status: result.Configured ? result.Status : 'inactive' },
							} );
						},
						onError( error: any ) {
							setError( pluginKey, error );
						},
					}
				)
		);
	}, [] );

	return (
		<Fragment>
			{ pluginsArray.map( pluginKey => {
				const isInactive = plugins[ pluginKey ].status === 'inactive';
				const isLoading = ! plugins[ pluginKey ].status;

				const plugin = PLUGINS[ pluginKey ];
				const error = getError( pluginKey );

				const getDescription = () => {
					if ( error ) {
						return __( 'Error!', 'newspack-plugin' );
					}
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
					<WizardsActionCard
						key={ pluginKey }
						title={ plugin.name }
						description={ getDescription() }
						actionText={ isInactive ? <PluginConnectButton plugin={ plugin } /> : null }
						isChecked={ ! ( isInactive || isLoading ) }
						badge={ plugin.badge }
						indent={ plugin.indent }
						error={ error }
						isMedium
					/>
				);
			} ) }
		</Fragment>
	);
};

export default Plugins;
