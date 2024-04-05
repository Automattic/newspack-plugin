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
import { GlobalNotices, Footer, Notice, Wizard } from '../../../../components/src';

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

const Connections = () => <h2>Connections</h2>;

const Emails = () => <h2>Emails</h2>;

const Social = () => <h2>Social</h2>;

const Settings = () => {
	return (
		<>
			<GlobalNotices />
			{ isDebugMode && <Notice debugMode /> }
			<Wizard
				headerText={ __( 'Newspack / Settings', 'newspack' ) }
				sections={ [
					{
						label: __( 'Connections', 'newspack' ),
						path: '/',
						exact: true,
						render: Connections,
					},
					{
						label: __( 'Emails', 'newspack' ),
						path: '/emails',
						render: Emails,
					},
					{
						label: __( 'Social', 'newspack' ),
						path: '/social',
						render: Social,
					},
				] }
				renderAboveSections={ () => <></> }
			/>
			<Footer />
		</>
	);
};

render( <Settings />, document.getElementById( 'newspack-settings' ) );
