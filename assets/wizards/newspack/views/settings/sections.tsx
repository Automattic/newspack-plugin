/**
 * Newspack - Dashboard, Sections
 *
 * Component for outputting sections with grid and cards
 */
import { __ } from '@wordpress/i18n';


export default [
	{
		label: __( 'Connections', 'newspack' ),
		path: '/',
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
];
