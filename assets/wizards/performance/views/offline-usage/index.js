/**
 * Performance Wizard Offline Usage screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
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
		const { settings, updateSetting } = this.props;
		return (
			<p>
				{ __(
					"No connection? No problem. We pre-cache all critical assets of your website, as well as all visited resources. So if there's no internet connection it will serve the resources from the local storage."
				) }
			</p>
		);
	}
}

export default withWizardScreen( OfflineUsage, {} );
