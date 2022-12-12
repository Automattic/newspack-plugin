/**
 * Social screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';
import MetaPixel from './meta-pixel';
import TwitterPixel from './twitter-pixel';

/**
 * Social Screen
 */
class Social extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<>
				<ActionCard
					title={ __( 'Publicize' ) }
					badge="Jetpack"
					description={ __(
						'Publicize makes it easy to share your site’s posts on several social media networks automatically when you publish a new post.'
					) }
					actionText={ __( 'Configure' ) }
					handoff="jetpack"
					editLink="admin.php?page=jetpack#/sharing"
				/>
				<MetaPixel />
				<TwitterPixel />
			</>
		);
	}
}

export default withWizardScreen( Social );
