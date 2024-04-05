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
import Wizard from '../../../../components/src/wizard';
import { GlobalNotices, Footer, Notice } from '../../../../components/src/';
import sections from './sections';

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

const Settings = () => {
	return (
		<>
			<GlobalNotices />
			{ isDebugMode && <Notice debugMode /> }
			<Wizard headerText={ __( 'Newspack / Settings', 'newspack' ) } sections={ sections } />
			<Footer />
		</>
	);
};

render( <Settings />, document.getElementById( 'newspack-settings' ) );
