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
import WizardsActionCard from '../../../../wizards-action-card';
import { Button, Handoff } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import useWizardError from '../../../../hooks/use-wizard-error';

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
		path: '/newspack/v1/plugins/google-site-kit',
	},
};

function PluginConnectButton( { plugin }: { plugin: PluginCard } ) {
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

const Plugin = ( { plugin }: { plugin: PluginCard } ) => {
	const { error, setError } = useWizardError(
		'newspack/settings',
		`connections/plugins${ plugin.pluginSlug }`
	);
	const { wizardApiFetch, isFetching } = useWizardApiFetch();
	const [ status, setStatus ] = useState( 'inactive' );

	useEffect( () => {
		wizardApiFetch(
			{ path: plugin.path },
			{
				onSuccess( result: { Status: string; Configured: boolean } ) {
					setStatus( result.Configured ? result.Status : 'inactive' );
				},
				onError( err: any ) {
					setError( err );
				},
			}
		);
	}, [] );

	const getDescription = () => {
		if ( error ) {
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
	};

	return (
		<WizardsActionCard
			title={ plugin.name }
			description={ getDescription() }
			actionText={ status === 'inactive' ? <PluginConnectButton plugin={ plugin } /> : null }
			isChecked={ ! ( status === 'inactive' || isFetching ) }
			badge={ plugin.badge }
			indent={ plugin.indent }
			error={ error }
			isMedium
		/>
	);
};

const Plugins = () => {
	return (
		<Fragment>
			{ Object.keys( PLUGINS ).map( pluginKey => {
				return <Plugin key={ pluginKey } plugin={ PLUGINS[ pluginKey ] } />;
			} ) }
		</Fragment>
	);
};

export default Plugins;
