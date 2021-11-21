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
import { PluginToggle, withWizardScreen } from '../../../../components/src';

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
							name: 'Apple News',
						},
						'fb-instant-articles': {
							name: 'Facebook Instant Articles',
						},
						'distributor-stable': true,
					} }
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( Intro );
