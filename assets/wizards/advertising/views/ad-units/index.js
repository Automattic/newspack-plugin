/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdUnits from '../../components/ad-units';
import { Notice, withWizardScreen } from '../../../../components/src';

/**
 * Ad Units View.
 */
const AdUnitsView = ( { adUnits, onDelete, updateAdUnit, serviceData } ) => {
	const { status } = serviceData;
	const isDisplayingNetworkMismatchNotice =
		status.can_connect && ! status?.error && false === status?.is_network_code_matched;

	return (
		<>
			{ isDisplayingNetworkMismatchNotice && (
				<Notice
					noticeText={ __(
						'Your GAM network code is different than the network code the site was configured with. Legacy ad units are likely to not load.',
						'newspack'
					) }
					isWarning
				/>
			) }
			<AdUnits
				serviceData={ serviceData }
				adUnits={ adUnits }
				onDelete={ onDelete }
				updateAdUnit={ updateAdUnit }
			/>
		</>
	);
};

export default withWizardScreen( AdUnitsView );
