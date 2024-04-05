/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */

/**
 * Dependencies.
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { render } from '@wordpress/element';
// Internal
import { GlobalNotices, Footer, Notice, Wizard } from '../../components/src';
import './style.scss';
import sections from './components/sections';
import BrandHeader from './components/brand-header';
import QuickActions from './components/quick-actions';

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
						<BrandHeader />
						<p>Site Actions</p>
						<QuickActions />
					</>
				) }
			/>
			<Footer />
		</>
	);
};

render( <Newspack />, document.getElementById( 'newspack-dashboard' ) );
