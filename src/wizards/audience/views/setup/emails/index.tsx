/**
 * Newspack > Audience > Configuration > Emails
 */

/**
 * Internal dependencies.
 */
import { withWizardScreen } from '../../../../../../packages/components/src';
import WizardsTab from '../../../../wizards-tab';
import { default as EmailsSection } from './emails';
import { default as SettingsSection } from './settings';
import WizardSection from '../../../../wizards-section';

const { emails } = window.newspackAudience;

export default withWizardScreen( function Emails() {
	return (
		<WizardsTab className="newspack-emails-tab">
			<WizardSection>
				<EmailsSection />
			</WizardSection>
			{ emails?.isEmailEnhancementsActive && (
				<WizardSection>
					<SettingsSection />
				</WizardSection>
			) }
		</WizardsTab>
	);
} );
