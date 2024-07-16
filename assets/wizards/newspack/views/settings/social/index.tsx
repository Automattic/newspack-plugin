/**
 * Newspack > Settings > Social
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import MetaPixel from '../../../../engagement/views/social/meta-pixel';
import TwitterPixel from '../../../../engagement/views/social/twitter-pixel';

/**
 * Internal dependencies
 */
import Section from '../../../../wizards-section';

function Social() {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Social', 'newspack-plugin' ) }</h1>

			<Section>
				<MetaPixel />
				<TwitterPixel />
			</Section>
		</div>
	);
}

export default Social;
