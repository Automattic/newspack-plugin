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
import sections from './sections';

const {
	newspack_aux_data: { is_debug_mode: isDebugMode = false },
} = window;

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
			path: '',
			render: () => (
				<h2>
					Connections
				</h2>
			),
		},
		{
			label: __( 'Emails', 'newspack' ),
			path: '/emails',
			render: () => (
				<h2>
					Emails
				</h2>
			),
		},
		{
			label: __( 'Social', 'newspack' ),
			path: '/social',
			render: () => (
				<h2>
					Social
				</h2>
			),
		},
	] }
	renderAboveSections={ () => <></> }
/>
			<Footer />
		</>
	);
};

render( <Settings />, document.getElementById( 'newspack-settings' ) );
