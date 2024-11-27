/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WizardsTab from '../../../wizards-tab';
import WizardSection from '../../../wizards-section';
import WizardsActionCard from '../../../wizards-action-card';
import { Button, Card } from '../../../../components/src';
import WizardsCard from '../../../wizards-card';

function Configuration() {
	return (
		<WizardsTab title={ __( 'Configuration', 'newspack-plugin' ) }>
			<WizardSection>
				<WizardsCard className="newspack-card__is-center">
					<h2>
						{ __(
							'Manage Subscriptions settings in Woo Memberships',
							'newspack-plugin'
						) }
					</h2>
					<p>
						{ __(
							'You can manage the details of your subscription offerings in the Woo Memberships plugin.',
							'newspack-plugin'
						) }
					</p>
					<Button variant="primary" href={ '#' }>
						{ __( 'Manage Subscriptions', 'newspack-plugin' ) }
					</Button>
				</WizardsCard>
			</WizardSection>
		</WizardsTab>
	);
}

export default Configuration;
