/**
 * Performance Wizard Offline Usage screen.
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
 * Description and controls for the Offline Usage feature.
 */
class OfflineUsage extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		return (
			<Fragment>
				<p>
					{ __(
						"No connection? No problem. We pre-cache all critical assets of your website, as well as all visited resources. So if there's no internet connection it will serve the resources from the local storage."
					) }
				</p>
			</Fragment>
		);
	}
}

export default withWizardScreen( OfflineUsage, {} );
