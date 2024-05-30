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

			<Section title={ __( 'Plugins', 'newspack-plugin' ) }>
				Plugins component - coming soon!
			</Section>
		</div>
	);
}

export default Connections;
