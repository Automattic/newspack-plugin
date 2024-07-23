/**
 * Ad Settings view.
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PluginSettings, withWizardScreen } from '../../../../components/src';
import WizardSection from '../../../wizards-section';
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
			<PluginSettings pluginSlug="newspack-ads" title={ null } />
			<WizardSection heading={ 2 }>
				<AdRefreshControlSettings />
			</WizardSection>
			<WizardSection heading={ 2 } title={ __( 'Suppression', 'newspack-plugin' ) }>
				<Suppression />
			</WizardSection>
			<WizardSection heading={ 2 } title={ __( 'Plugins', 'newspack-plugin' ) }>
				<AddOns />
			</WizardSection>
		</Fragment>
	);
}

export default withWizardScreen( Settings );
