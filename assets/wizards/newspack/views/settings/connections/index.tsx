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
import Plugins from './plugins';
import Webhooks from './webhooks';
import Analytics from './analytics';
import CustomEvents from './custom-events';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';

function Connections() {
	return (
		<WizardsTab title={ __( 'Connections', 'newspack-plugin' ) }>
			{ /* Plugins */ }
			<WizardSection title={ __( 'Plugins', 'newspack-plugin' ) }>
				<Plugins />
			</WizardSection>

			{ /* APIs; google */ }
			<WizardSection title={ __( 'APIs', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
			</WizardSection>

			{ /* reCAPTCHA */ }
			<WizardSection title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) }>
				<div className="newspack-card">Coming soon</div>
			</WizardSection>

			{ /* Webhooks */ }
			<WizardSection>
				<Webhooks />
			</WizardSection>

			{ /* Analytics */ }
			<WizardSection title={ __( 'Analytics', 'newspack-plugin' ) }>
				<Analytics />
			</WizardSection>

			{ /* Custom Events */ }
			<WizardSection
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
			>
				<CustomEvents />
			</WizardSection>
		</WizardsTab>
	);
}

export default Connections;
