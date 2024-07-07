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
import './style.scss';
import Webhooks from './webhooks';
import CustomEvents from './custom-events';
import Section from '../../../../wizards-section';

function Connections() {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Connections', 'newspack-plugin' ) }</h1>

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
			<Section>
				<Webhooks />
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
				<CustomEvents />
			</Section>
		</div>
	);
}

export default Connections;
