/**
 * Internal dependencies
 */
import { withWizardScreen, PluginSettings } from '../../../../components/src';

const Settings = () => {
	return <PluginSettings pluginSlug="newspack-popups-wizard" isWizard={ true } title={ null } />;
};

export default withWizardScreen( Settings );
