/**
 * Settings Wizard: Plugin Card component.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../components/src';
import WizardsActionCard from './wizards-action-card';
import { useWizardApiFetch } from './hooks/use-wizard-api-fetch';

function WizardsPluginConnectButton( { plugin }: { plugin: PluginCard } ) {
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

function WizardsPluginCard( { plugin, description }: { plugin: PluginCard } & ActionCardProps ) {
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
		<WizardsActionCard
			title={ plugin.name }
			description={ description ?? `${ __( 'Status', 'newspack-plugin' ) }: ${ getDescription() }` }
			actionText={ status === 'inactive' ? <WizardsPluginConnectButton plugin={ plugin } /> : null }
			isChecked={ ! ( status === 'inactive' || isFetching ) }
			badge={ plugin.badge }
			indent={ plugin.indent }
			error={ errorMessage }
			isMedium
		/>
	);
}

export default WizardsPluginCard;
