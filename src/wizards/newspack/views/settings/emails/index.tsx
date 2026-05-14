/**
 * Newspack > Settings > Emails
 */

/**
 * Internal dependencies.
 */
import WizardsTab from '../../../../wizards-tab';
import { default as EmailsSection } from './emails';
import { default as SettingsSection } from './settings';
import WizardSection from '../../../../wizards-section';

const { emails } = window.newspackSettings;

function Emails() {
	return (
		<WizardsTab className="newspack-emails-tab">
			<WizardSection>
				<EmailsSection />
			</WizardSection>
			{ emails?.sections?.emails?.isEmailEnhancementsActive && (
				<WizardSection>
					<SettingsSection />
				</WizardSection>
			) }
		</WizardsTab>
	);
}

export default Emails;
