/**
 * Performance Wizard Offline Usage screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

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
			<Fragment>
				<p>
					{ __(
						"No connection? No problem. We pre-cache all critical assets of your website, as well as all visited resources. So if there's no internet connection it will serve the resources from the local storage."
					) }
				</p>
				<ToggleControl
					label={ __( 'Enable Offline Usage' ) }
					onChange={ checked => updateSetting( 'offline_usage', checked, true ) }
					checked={ settings.offline_usage }
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( OfflineUsage, {} );
