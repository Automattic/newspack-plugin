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
import './style.scss';
import Plugins from './plugins';
import Webhooks from './webhooks';
import Analytics from './analytics';
import Mailchimp from './mailchimp';
import Recaptcha from './recaptcha';
import GoogleOAuth from './google-oauth';
import CustomEvents from './custom-events';
import { SectionHeader } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { WIZARD_STORE_NAMESPACE } from '../../../../../components/src/wizard/store';

const { connections } = window.newspackSettings;

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

const CACHE_KEY = '/newspack-settings/connections';

function Connections() {
	const { wizardApiFetch, isFetching, error } = useWizardApiFetch( CACHE_KEY );

	const wizardData: any = useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).getWizardData( CACHE_KEY )
	);

	const [ status, setStatus ] = useState( 'idle' );
	const [ statusTwo, setStatusTwo ] = useState( 'idle' );

	useEffect( () => {
		for ( const plugin of [ 'jetpack', 'jetpacks' ] ) {
			const stateHandler = plugin === 'jetpack' ? setStatus : setStatusTwo;
			wizardApiFetch(
				{ path: `/newspack/v1/plugins/${ plugin }` },
				{
					onStart() {
						stateHandler( 'Start' );
					},
					onSuccess() {
						stateHandler( 'Success' );
					},
					onError() {
						stateHandler( 'Error' );
					},
				}
			);
		}
	}, [] );

	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Connections', 'newspack-plugin' ) }</h1>
			{ /* Plugins */ }
			<Section title={ __( 'Plugins', 'newspack-plugin' ) }>
				<Plugins />
			</Section>

			{ /* APIs; google */ }
			<Section title={ __( 'APIs', 'newspack-plugin' ) }>
				{ connections.sections.apis.dependencies.googleOAuth && <GoogleOAuth /> }
				<Mailchimp />
			</Section>

			{ /* reCAPTCHA */ }
			<Section title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) }>
				<Recaptcha />
			</Section>

			{ /* Webhooks */ }
			<Section>
				<Webhooks />
			</Section>

			{ /* Analytics */ }
			<Section title={ __( 'Analytics', 'newspack-plugin' ) }>
				<Analytics editLink={ connections.sections.analytics.editLink } />
			</Section>

			{ /* Custom Events */ }
			<Section
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
			>
				<CustomEvents />
			</Section>
		</div>
	);
}

export default Connections;
