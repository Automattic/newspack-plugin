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
import { Notice, withWizardScreen } from '../../../../components/src';
import AdUnits from '../../components/ad-units';

/**
 * Ad Units View.
 */
const AdUnitsView = ( { adUnits, onDelete, updateAdUnit, serviceData } ) => {
	const { status } = serviceData;
	const gamConnectionMessage = serviceData?.status?.error
		? `${ __( 'Google Ad Manager connection error', 'newspack' ) }: ${ status.error }`
		: false;

	const shouldDisplayCodeMismatchMessage =
		! gamConnectionMessage && false === status?.is_network_code_matched && status?.connected;

	return (
		<>
			{ shouldDisplayCodeMismatchMessage && (
				<Notice
					noticeText={ __(
						'Your GAM network code is different than the network code the site was configured with. Legacy ad units are likely to not load.',
						'newspack'
					) }
					isWarning
				/>
			) }
			{ ! status.can_connect && (
				<Notice noticeText={ __( 'Currently operating in legacy mode.', 'newspack' ) } isWarning />
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
