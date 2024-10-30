/**
 * Configuration
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../../../components/src';

function AudienceCampaigns() {
	return (
		<h1>
			{ __( 'Audience Campaigns - Coming Soon!', 'newspack-plugin' ) }
		</h1>
	);
}

export default withWizard( AudienceCampaigns );
