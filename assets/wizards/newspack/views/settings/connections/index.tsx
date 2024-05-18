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

const { connections } = window.newspackSettings.tabs;

const Connections = () => {
	return (
		<div className="newspack-dashboard__section">
			<h1>{ __( 'Connections', 'newspack-plugin' ) }</h1>
			{ /* Plugins */ }
			<SectionHeader heading={ 3 } title={ __( 'Plugins', 'newspack-plugin' ) } />
			<Plugins />
			{ /* APIs; google */ }
			<SectionHeader heading={ 3 } title={ __( 'APIs', 'newspack-plugin' ) } />
			{ connections.dependencies.google && <GoogleOAuth /> }
			<Mailchimp />
			{ /* reCAPTCHA */ }
			<SectionHeader heading={ 3 } title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) } />
			<Recaptcha />
			{ /* Webhooks */ }
			{ connections.dependencies.webhooks && <Webhooks /> }
			{ /* Analytics */ }
			<SectionHeader heading={ 3 } title={ __( 'Analytics', 'newspack-plugin' ) } />
			<Analytics editLink={ connections.sections.analytics.editLink } />
			{ /* Custom Events */ }
			<SectionHeader
				title={ __( 'Activate Newspack Custom Events', 'newspack-plugin' ) }
				heading={ 3 }
				description={ __(
					'Allows Newspack to send enhanced custom event data to your Google Analytics.',
					'newspack-plugin'
				) }
			/>
			<CustomEvents />
		</div>
	);
};

export default Connections;
