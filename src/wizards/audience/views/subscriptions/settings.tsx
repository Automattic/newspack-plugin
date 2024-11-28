/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WizardSection from '../../../wizards-section';
import WizardsTab from '../../../wizards-tab';
import BillingFields from '../../components/billing-fields';

function Settings() {
	return (
		<WizardsTab title={ __( 'Settings', 'newspack-plugin' ) }>
			<WizardSection>
				<BillingFields />
			</WizardSection>
		</WizardsTab>
	);
}

export default Settings;
