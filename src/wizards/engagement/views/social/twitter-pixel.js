/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pixel from './pixel';

const TwitterPixel = () => (
	<Pixel
		title={ __( 'Twitter Pixel', 'newspack-plugin' ) }
		pixelKey="twitter"
		description={ __( 'Add the Twitter pixel to your site.', 'newspack-plugin' ) }
		pixelValueType="text"
		fieldDescription={ __( 'Pixel ID', 'newspack-plugin' ) }
		fieldHelp={ createInterpolateElement(
			__(
				'The Twitter Pixel ID. You only need to add the ID, not the full code. Example: ny3ad. You can read more about it <link>here</link>.',
				'newspack-plugin'
			),
			{
				/* eslint-disable jsx-a11y/anchor-has-content */
				link: (
					<a
						href="https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html"
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		) }
	/>
);

export default TwitterPixel;
