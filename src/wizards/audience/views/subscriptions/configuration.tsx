/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WizardsTab from '../../../wizards-tab';
import WizardSection from '../../../wizards-section';
import { Button, Card } from '../../../../components/src';

function Configuration() {
	return (
		<WizardsTab title={ __( 'Configuration', 'newspack-plugin' ) }>
			<WizardSection>
				<Card isNarrow>
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
				</Card>
			</WizardSection>
		</WizardsTab>
	);
}

export default Configuration;
