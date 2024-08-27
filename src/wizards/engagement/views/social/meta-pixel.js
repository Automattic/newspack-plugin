/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Pixel from './pixel';

const MetaPixel = () => (
	<Pixel
		title={ __( 'Meta Pixel', 'newspack-plugin' ) }
		pixelKey="meta"
		pixelValueType="integer"
		description={ __(
			'Add the Meta pixel (formely known as Facebook pixel) to your site.',
			'newspack-plugin'
		) }
		fieldDescription={ __( 'Pixel ID', 'newspack-plugin' ) }
		fieldHelp={ createInterpolateElement(
			__(
				'The Meta Pixel ID. You only need to add the number, not the full code. Example: 123456789123456789. You can get this information <linkToFb>here</linkToFb>.',
				'newspack-plugin'
			),
			{
				/* eslint-disable jsx-a11y/anchor-has-content */
				linkToFb: (
					<a
						href="https://www.facebook.com/ads/manager/pixel/facebook_pixel"
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		) }
	/>
);

export default MetaPixel;
