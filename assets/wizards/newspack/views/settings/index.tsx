/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { render } from '@wordpress/element';

/**
 * Internal Imports
 */
import sections from './sections';
import Wizard from '../../../../components/src/wizard';
import { GlobalNotices, Footer, Notice } from '../../../../components/src/';
import './style.scss';

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

const Settings = () => {
	return (
		<>
			{ isDebugMode && <Notice debugMode /> }
			<GlobalNotices />
			<Wizard headerText={ __( 'Newspack / Settings', 'newspack' ) } sections={ sections } />
			<Footer />
		</>
	);
};

render( <Settings />, document.getElementById( 'newspack-settings' ) );
