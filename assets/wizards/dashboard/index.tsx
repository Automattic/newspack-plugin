/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */
import '../../shared/js/public-path';

/**
 * Dependencies.
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { render } from '@wordpress/element';
// Internal
import { GlobalNotices, Footer, Notice, Wizard } from '../../components/src';
import sections from './components/sections';
import SiteStatuses from './components/site-statuses';
import './style.scss';

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

const Newspack = () => {
	return (
		<>
			<GlobalNotices />
			{ isDebugMode && <Notice debugMode /> }
			<Wizard
				headerText={ __( 'Newspack / Dashboard', 'newspack' ) }
				sections={ sections }
				renderAboveSections={ () => (
					<>
						<p>Brand Header</p>
						<SiteStatuses />
						<p>Quick Actions</p>
					</>
				) }
			/>
			<Footer />
		</>
	);
};

render( <Newspack />, document.getElementById( 'newspack' ) );
