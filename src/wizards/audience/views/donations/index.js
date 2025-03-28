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
import { Wizard, Notice, withWizard } from '../../../../components/src';
import Configuration from './configuration';
import { AUDIENCE_DONATIONS_WIZARD_SLUG, OTHER } from '../../constants';

const AudienceDonations = () => {
	const { platform_data, donation_data } = Wizard.useWizardData( AUDIENCE_DONATIONS_WIZARD_SLUG );
	const usedPlatform = platform_data?.platform;
	const sections = [
		{
			label: __( 'Configuration', 'newspack-plugin' ),
			path: '/configuration',
			render: Configuration,
			isHidden: usedPlatform === OTHER,
		},
	];
	return (
		<Wizard
			headerText={ __( 'Audience Management / Donations', 'newspack-plugin' ) }
			sections={ sections }
			apiSlug={ AUDIENCE_DONATIONS_WIZARD_SLUG }
			renderAboveSections={ () =>
				values( donation_data?.errors ).map( ( error, i ) => (
					<Notice key={ i } isError noticeText={ error } />
				) )
			}
			requiredPlugins={ [ 'newspack-blocks' ] }
		/>
	);
};

export default withWizard( AudienceDonations );
