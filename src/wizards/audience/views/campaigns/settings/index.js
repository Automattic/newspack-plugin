/**
 * Internal dependencies
 */
import { withWizardScreen, PluginSettings } from '../../../../../components/src';

const Settings = () => {
	return <PluginSettings pluginSlug="newspack-audience-campaigns-wizard" isWizard={ true } title={ null } />;
};

export default withWizardScreen( Settings );
