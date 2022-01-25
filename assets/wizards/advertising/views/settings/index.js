/**
 * Ad Settings view.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PluginSettings, withWizardScreen } from '../../../../components/src';

/**
 * Advertising management screen.
 */
class Settings extends Component {
	render() {
		return <PluginSettings pluginSlug="newspack-ads" title={ null } />;
	}
}

export default withWizardScreen( Settings );
