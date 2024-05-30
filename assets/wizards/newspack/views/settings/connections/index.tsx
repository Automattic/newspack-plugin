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
import { SectionHeader } from '../../../../../components/src';

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

const { connections } = window.newspackSettings;

function Connections() {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Connections', 'newspack-plugin' ) }</h1>

			{ /* Plugins */ }
			<Section title={ __( 'Plugins', 'newspack-plugin' ) }>Plugins section coming soon</Section>

			{ /* APIs; google */ }
			<Section title={ __( 'APIs', 'newspack-plugin' ) }>Mailchimp section coming soon</Section>

			{ /* reCAPTCHA */ }
			<Section title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) }>
				reCAPTCHA section coming soon
			</Section>

			{ /* Webhooks */ }
			<Section title={ __( 'Webhooks', 'newspack-plugin' ) }>Webhooks section coming soon</Section>

			{ /* Analytics */ }
			<Section title={ __( 'Analytics', 'newspack-plugin' ) }>
				Analytics section coming soon
			</Section>

			{ /* Custom Events */ }
			<Section
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
			>
				Custom Events section coming soon
			</Section>
		</div>
	);
}

export default Connections;
