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

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

const Settings = () => {
	return (
		<>
			<GlobalNotices />
			{ isDebugMode && <Notice debugMode /> }
			<Wizard
				headerText={ __( 'Newspack / Dashboard', 'newspack' ) }
				sections={ sections }
				renderAboveSections={ () => (
					<>
					</>
				) }
			/>
			<Footer />
		</>
	);
};

render( <Settings />, document.getElementById( 'newspack' ) );