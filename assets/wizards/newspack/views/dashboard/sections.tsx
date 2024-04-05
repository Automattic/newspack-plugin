/**
 * Newspack - Dashboard, Sections
 *
 * Component for outputting sections with grid and cards
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
/* eslint import/namespace: ['error', { allowComputed: true }] */

const {
	newspackDashboard: { sections: dashSections },
} = window;

export default [
	{
		label: __( 'Dashboard', 'newspack' ),
		path: '/',
		render: () => {
			const dashSectionsKeys = Object.keys( dashSections );
			return dashSectionsKeys.map( sectionKey => {
				return (
					<Fragment key={ sectionKey }>
						<p>{ dashSections[ sectionKey ].title }</p>
					</Fragment>
				);
			} );
		},
	},
];
