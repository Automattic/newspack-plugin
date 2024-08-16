/**
 * Ad Settings view.
 */

/**
 * Internal dependencies
 */
import { PluginSettings, withWizardScreen } from '../../../../components/src';
import AdRefreshControlSettings from '../../components/ad-refresh-control';

/**
 * Advertising management screen.
 */
function Settings() {
	return (
		<PluginSettings pluginSlug="newspack-ads" title={ null }>
			<AdRefreshControlSettings />
		</PluginSettings>
	);
}

export default withWizardScreen( Settings );
