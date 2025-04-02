/**
 * Ad Settings view.
 */

/**
 * Internal dependencies
 */
import { PluginSettings, withWizardScreen } from '../../../../components/src';
import AdRefreshControlSettings from '../../components/ad-refresh-control';
import MediaKitToggle from '../../components/media-kit';

/**
 * Advertising management screen.
 */
function Settings() {
	return (
		<PluginSettings pluginSlug="newspack-ads" title={ null }>
			<AdRefreshControlSettings />
			<MediaKitToggle />
		</PluginSettings>
	);
}

export default withWizardScreen( Settings );
