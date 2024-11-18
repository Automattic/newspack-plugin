import '../../../../shared/js/public-path';

/**
 * External dependencies.
 */
import values from 'lodash/values';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard, Wizard, Notice } from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from './constants';

const headerText = __( 'Audience Development / Donations', 'newspack-plugin' );

const tabbedNavigation = [
	{
		label: __( 'Configuration', 'newpack-plugin' ),
		path: '/configuration',
		exact: true,
	},
	{
		label: __( 'Revenue', 'newpack-plugin' ),
		path: '/revenue',
		exact: false,
	},
];

function AudienceDonations() {
	const { donation_data } = Wizard.useWizardData( 'reader-revenue' );

	return (
		<Wizard
			headerText={ headerText }
			sections={ tabbedNavigation }
			apiSlug={ READER_REVENUE_WIZARD_SLUG }
			renderAboveSections={ () =>
				values( donation_data?.errors ).map( ( error, i ) => (
					<Notice key={ i } isError noticeText={ error } />
				) )
			}
		/>
	);
}
export default withWizard( AudienceDonations, [ 'newspack-blocks' ] );
