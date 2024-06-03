/**
 * Settings Connections: Plugins, APIs, reCAPTCHA, Webhooks, Analytics, Custom Events
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SectionHeader } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { WIZARD_STORE_NAMESPACE } from '../../../../../components/src/wizard/store';

function Section( {
	title,
	description,
	children = null,
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
} ) {
	return (
		<div className="newspack-wizard__section">
			{ title && <SectionHeader heading={ 3 } title={ title } description={ description } /> }
			{ children }
		</div>
	);
}

function Connections() {
	const { wizardApiFetch, isFetching, error } = useWizardApiFetch(
		`/newspack-settings/connections`
	);
	const { getWizardData } = useSelect( select => select( WIZARD_STORE_NAMESPACE ) );
	const [ result, setResult ] = useState( null );
	const [ errorObj, setErrorObj ] = useState( null );
	useEffect( () => {
		wizardApiFetch(
			{ path: '/newspack/v1/plugins/jetpack' },
			{
				onSuccess( result ) {
					console.log( result );
					setResult( result );
				},
			}
		);
		wizardApiFetch(
			{ path: '/newspack/v1/plugins/jetpacks' },
			{
				onError( error ) {
					setErrorObj( error );
				},
			}
		);
	}, [] );
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Connections', 'newspack-plugin' ) }</h1>
			<pre>
				{ JSON.stringify(
					{
						getter: getWizardData( `/newspack-settings/connections` ),
						'GET:/newspack/v1/plugins/jetpack': result,
						'GET:/newspack/v1/plugins/jetpacks': errorObj,
						isFetching,
						error,
					},
					null,
					2
				) }
			</pre>
			{ /* Plugins */ }
			<Section title={ __( 'Plugins', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
				<div className="newspack-card">Coming soon</div>
			</Section>

			{ /* APIs; google */ }
			<Section title={ __( 'APIs', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
			</Section>

			{ /* reCAPTCHA */ }
			<Section title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
			</Section>

			{ /* Webhooks */ }
			<Section title={ __( 'Webhooks', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
			</Section>

			{ /* Analytics */ }
			<Section title={ __( 'Analytics', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
			</Section>

			{ /* Custom Events */ }
			<Section
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
			>
				<div className="newspack-card">Coming soon</div>
			</Section>
		</div>
	);
}

export default Connections;
