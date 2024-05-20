/**
 * Settings Connections: Plugins, APIs, reCAPTCHA, Webhooks, Analytics, Custom Events
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Plugins from './plugins';
import GoogleOAuth from './google-oauth';
import Mailchimp from './mailchimp';
import Recaptcha from './recaptcha';
import Webhooks from './webhooks';
import Analytics from './analytics';
import CustomEvents from './custom-events';
import { SectionHeader } from '../../../../../components/src';

const { connections } = window.newspackSettings;

const Section = ( {
	title,
	description,
	children = null,
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
} ) => {
	return (
		<div className="newspack-wizard__section">
			{ title && <SectionHeader heading={ 3 } title={ title } description={ description } /> }
			{ children }
		</div>
	);
};

const Connections = () => {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Connections', 'newspack-plugin' ) }</h1>
			{ /* Plugins */ }
			<Section title={ __( 'Plugins', 'newspack-plugin' ) }>
				<Plugins />
			</Section>

			{ /* APIs; google */ }
			<Section title={ __( 'APIs', 'newspack-plugin' ) }>
				{ connections.dependencies.google && <GoogleOAuth /> }
				<Mailchimp />
			</Section>

			{ /* reCAPTCHA */ }
			<Section title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) }>
				<Recaptcha />
			</Section>

			{ /* Webhooks */ }
			{ connections.dependencies.webhooks && (
				<Section>
					<Webhooks />
				</Section>
			) }

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
};

export default Connections;
