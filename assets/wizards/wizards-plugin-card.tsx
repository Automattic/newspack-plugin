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

function WizardsPluginConnectButton( {
	slug,
	url,
	editLink,
	error,
	actionText,
	isFetching,
}: PluginCard ) {
	if ( isFetching ) {
		return <span className="gray-700">{ __( 'Retrieving Plugin Info…', 'newspack-plugin' ) }</span>;
	}
	if ( slug ) {
		return <a href={ editLink }>{ actionText ?? __( 'Connect', 'newspack-plugin' ) }</a>;
	}
	if ( url ) {
		return (
			<Button variant="link" href={ url } target="_blank">
				{ actionText ?? __( 'Connect', 'newspack-plugin' ) }
			</Button>
		);
	}
	if ( error && error.errorCode === 'unavailable_site_id' ) {
		return (
			<span className="i newspack-error">
				{ __( 'Jetpack connection required', 'newspack-plugin' ) }
			</span>
		);
	}
	return null;
}

function WizardsPluginCard( {
	slug,
	path,
	description,
	name,
	url,
	editLink,
	actionText,
}: PluginCard ) {
	const { wizardApiFetch, isFetching, errorMessage, error } = useWizardApiFetch(
		`/newspack-settings/connections/plugins/${ slug }`
	);
	const [ status, setStatus ] = useState< string >( 'inactive' );

	useEffect( () => {
		wizardApiFetch< null | { Status: string; Configured: boolean } >(
			{ path },
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
		if ( typeof description === 'function' ) {
			return description( errorMessage, isFetching, status );
		}
		if ( typeof description === 'string' ) {
			return description;
		}

		// Description if not provided.
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
	}

	return (
		<WizardsActionCard
			title={ name }
			description={ getDescription() }
			actionText={
				status === 'inactive' ? (
					<WizardsPluginConnectButton
						slug={ slug }
						url={ url }
						editLink={ editLink }
						path={ path }
						name={ name }
						error={ error }
						isFetching={ isFetching }
						actionText={ actionText }
					/>
				) : null
			}
			isChecked={ status !== 'inactive' }
			error={ errorMessage }
			isMedium
		/>
	);
}

export default WizardsPluginCard;
