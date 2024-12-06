/* globals newspackAudienceDonations */
/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, Card } from '../../../../../components/src';
import WizardsTab from '../../../../wizards-tab';

/**
 * Donation Revenues screen.
 */
const DonationsRevenue = () => (
	<WizardsTab title={ __( 'Revenue', 'newspack-plugin' ) }>
		<div className="newspack-campaigns-wizard-analytics__wrapper">
			<Card isNarrow>
				<h2>{ __( 'View Donation Revenue in WooCommerce', 'newspack-plugin' ) }</h2>
				<p>
					{
						__(
							'You can view revenue from donations and subscriptions in the WooCommerce plugin.',
							'newspack-plugin'
						)
					}
				</p>
				<Card buttonsCard noBorder>
					<Button isPrimary href={ newspackAudienceDonations.revenue_link }>
						{ __( 'See Revenue Data', 'newspack-plugin' ) }
					</Button>
				</Card>
			</Card>
	</div>
	</WizardsTab>
);

export default DonationsRevenue;
