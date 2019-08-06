/**
 * Plugin Installation Progress Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PluginInstaller, withWizardScreen } from '../../../../components/src';

/**
 * Plugin Installation Screen.
 */
class InstallationProgress extends Component {
	/**
	 * Render.
	 */
	render() {
		const { plugins, onStatus } = this.props;
		return (
			<PluginInstaller
				autoInstall
				plugins={ plugins }
				onStatus={ onStatus }
			/>
		);
	}
}

export default withWizardScreen( InstallationProgress );
