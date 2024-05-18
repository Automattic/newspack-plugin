/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GlobalNotices, Notice, Wizard } from '../../../../components/src';
import sections from './sections';
import BrandHeader from '../../components/brand-header';
import QuickActions from '../../components/quick-actions';
import SiteStatuses from '../../components/site-statuses';
import './style.scss';

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

const Dashboard = () => {
	return (
		<>
			<GlobalNotices />
			{ isDebugMode && <Notice debugMode /> }
			<Wizard
				headerText={ __( 'Newspack / Dashboard', 'newspack' ) }
				sections={ sections }
				renderAboveSections={ () => (
					<>
						<BrandHeader />
						<SiteStatuses />
						<hr />
						<QuickActions />
					</>
				) }
			/>
		</>
	);
};

export default Dashboard;
