/**
 * Newspack > Settings > Emails.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';

export default function DisplaySettings() {
	return (
		<WizardsTab title={ __( 'Display Settings', 'newspack-plugin' ) }>
			<WizardSection>WIP</WizardSection>
		</WizardsTab>
	);
}
