/**
 * Newspack - Status
 *
 * Displays Newspack ActionScheduler actions using DataViews.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionScheduler, GlobalNotices, Wizard } from '../../../../../packages/components/src';

// Stable sections array for Wizard — renders nothing (DataViews is rendered outside).
const WIZARD_SECTIONS = [ { path: '/', render: () => null } ];

function Status() {
	return (
		<>
			<GlobalNotices />
			<Wizard headerText={ __( 'Newspack / Status', 'newspack-plugin' ) } sections={ WIZARD_SECTIONS } />
			<ActionScheduler />
		</>
	);
}

export default Status;
