/**
 * Ad Settings view.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginSettings, withWizardScreen } from '../../../../components/src';

/**
 * Advertising management screen.
 */
class Settings extends Component {
	render() {
		return (
			<PluginSettings
				pluginSlug="newspack-ads"
				title={ __( 'General Settings', 'newspack' ) }
				description={ __( 'Configure display and advanced settings for your ads.', 'newspack' ) }
			/>
		);
	}
}

export default withWizardScreen( Settings );
