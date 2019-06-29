/**
 * Performance Wizard Add To Homescreen screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';

/**
 * Description and controls for the Add To Homescreen feature.
 */
class AddToHomeScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		return (
			<Fragment>
				<p>
					{ __(
						'With this feature you are able to display an "add to homescreen" prompt. This way your news site gets a prominent place on the users home screen right next to the native apps.'
					) }
				</p>
			</Fragment>
		);
	}
}

export default withWizardScreen( AddToHomeScreen, {} );
