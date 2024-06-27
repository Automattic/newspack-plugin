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
import Analytics from './analytics';
import CustomEvents from './custom-events';
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
			<Section title={ __( 'Plugins', 'newspack-plugin' ) }>
				<Plugins />
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
