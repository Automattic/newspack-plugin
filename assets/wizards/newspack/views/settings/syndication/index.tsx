/**
 * Settings Syndication: RSS, Apple News, and Distributor.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Rss from './rss';
import Plugins from './plugins';
import Section from '../../../../wizards-section';

function Syndication() {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Syndication', 'newspack-plugin' ) }</h1>
			<Section>
				<Rss />
				<Plugins />
			</Section>
		</div>
	);
}

export default Syndication;
