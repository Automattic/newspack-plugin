/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen, PluginSettings } from '../../../../components/src';

const Settings = () => {
	return (
		<PluginSettings
			pluginSlug="newspack-popups-wizard"
			isWizard={ true }
			title={ __( 'Campaigns Plugin Settings', 'newspack' ) }
			description={ __( 'Configure display and advanced settings for your prompts.', 'newspack' ) }
		/>
	);
};

export default withWizardScreen( Settings );
