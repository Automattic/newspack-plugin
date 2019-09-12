/**
 * Engagement Intro screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';

/**
 * Engagement Intro screen.
 */
class Intro extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<ActionCard
					title={ __( 'Yoast SEO' ) }
					description={ __(
						'The first true all-in-one SEO solution for WordPress, including on-page content analysis, XML sitemaps and much more.'
					) }
					actionText={ __( 'Configure' ) }
					handoff="wordpress-seo"
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( Intro );
