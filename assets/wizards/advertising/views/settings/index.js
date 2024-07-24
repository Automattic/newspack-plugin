/**
 * Ad Settings view.
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PluginSettings, SectionHeader, withWizardScreen } from '../../../../components/src';
import AdRefreshControlSettings from '../../components/ad-refresh-control';
import AddOns from '../../components/add-ons';
import Suppression from '../suppression';

/**
 * Advertising management screen.
 */
function Settings() {
	return (
		<Fragment>
			<h1>{ __( 'Settings', 'newspack-plugin' ) }</h1>
			<PluginSettings pluginSlug="newspack-ads" title={ null }>
				<AdRefreshControlSettings />
				<SectionHeader className="heading-1" title={ __( 'Suppression', 'newspack-plugin' ) } />
				<Suppression />
				<SectionHeader className="heading-1" title={ __( 'Plugins', 'newspack-plugin' ) } />
				<AddOns />
			</PluginSettings>
		</Fragment>
	);
}

export default withWizardScreen( Settings );
