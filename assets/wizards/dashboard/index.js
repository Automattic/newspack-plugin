/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */

import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { render } from '@wordpress/element';
/**
 * Internal dependencies.
 */
import sections from './components/sections';
import QuickActions from './components/quick-actions';
import SiteStatus from './components/site-status';
import { GlobalNotices, Footer, Notice, Wizard } from '../../components/src';
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
						<SiteStatus />
						<QuickActions />
					</>
				) }
			/>
			<Footer />
		</>
	);
};

render( <Newspack />, document.getElementById( 'newspack' ) );
