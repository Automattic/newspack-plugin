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
	default: {
		label: __( 'Error: Not Found!', 'newspack-plugin' ),
		component: <h2>Not Found: { pageParam }</h2>,
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
	const PageComponent = components[ pageParam ].component ?? components.default.component;
	return (
		<Suspense
			fallback={
				<AdminPageLoader label={ components[ pageParam ].label ?? components.default.label } />
			}
		>
			<PageComponent />
		</Suspense>
	);
};

if ( rootElement ) {
	render( <AdminPages />, rootElement );
} else {
	console.error( `rootElement (${ pageParam }) not found!` );
}
