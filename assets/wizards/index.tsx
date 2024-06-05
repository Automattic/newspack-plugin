/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { render, lazy, Suspense } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as Components from '../components/src';

/**
 * Internal dependencies
 */
import '../shared/js/public-path';

const pageParam = new URLSearchParams( window.location.search ).get( 'page' ) ?? '';
const rootElement = document.getElementById( pageParam );

const ALLOWED_PAGES = [ 'newspack-dashboard', 'newspack-settings' ];

const components: Record< string, any > = {
	/**
	 * `page` param with `newspack-*`.
	 */
	'newspack-dashboard': {
		label: __( 'Dashboard', 'newspack-plugin' ),
		component: lazy(
			() => import( /* webpackChunkName: "newspack-wizards" */ './newspack/views/dashboard' )
		),
	},
	'newspack-settings': {
		label: __( 'Settings', 'newspack-plugin' ),
		component: lazy(
			() => import( /* webpackChunkName: "newspack-wizards" */ './newspack/views/settings' )
		),
	},
} as const;

const AdminPageLoader = ( { label }: { label: string } ) => {
	return (
		<div className="newspack-wizard__loader">
			<div>
				<Components.Waiting
					style={ {
						height: '50px',
						width: '50px',
					} }
					isCenter
				/>
				<span>
					{ label } { __( 'loading', 'newspack-plugin' ) }…
				</span>
			</div>
		</div>
	);
};

const AdminPages = () => {
	const PageComponent = components[ pageParam ].component;
	return (
		<Suspense fallback={ <AdminPageLoader label={ components[ pageParam ].label } /> }>
			<PageComponent />
		</Suspense>
	);
};

if ( rootElement && ALLOWED_PAGES.includes( pageParam ) ) {
	render( <AdminPages />, rootElement );
} else {
	console.error( `${ pageParam } not found!` );
}
