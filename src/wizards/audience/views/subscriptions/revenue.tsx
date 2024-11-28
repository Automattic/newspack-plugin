/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Card } from '../../../../components/src';
import WizardSection from '../../../wizards-section';
import WizardsTab from '../../../wizards-tab';

function Revenue() {
	return (
		<WizardsTab title={ __( 'Revenue', 'newspack-plugin' ) }>
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

export default Revenue;
