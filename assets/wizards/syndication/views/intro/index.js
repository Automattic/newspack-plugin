/**
 * Syndication Intro View
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginToggle } from '../../../../components/src';

/**
 * Syndication Intro screen.
 */
class Intro extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<PluginToggle
					plugins={ {
						'newspack-rss-enhancements': {
							name: __( 'RSS Enhancements', 'newspack' ),
							actionText: __( 'Manage', 'newspack' ),
						},
						'publish-to-apple-news': {
							name: __( 'Apple News', 'newspack' ),
						},
						'distributor-stable': {
							name: __( 'Distributor', 'newspack' ),
						},
					} }
				/>
			</Fragment>
		);
	}
}

export default Intro;
