import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Fragment, render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Welcome, Settings, Services, Design, Completed } from './views/';
import { withWizard, Notice } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import './style.scss';

const { HashRouter, Route } = Router;

const ROUTES = [
	{
		path: '/',
		label: __( 'Welcome', 'newspack' ),
		render: Welcome,
		isHiddenInNav: true,
	},
	{
		path: '/settings',
		label: __( 'Settings', 'newspack' ),
		subHeaderText: __( 'Share a few details so we can start setting up your site', 'newspack' ),
		render: Settings,
	},
	{
		path: '/services',
		label: __( 'Services', 'newspack' ),
		subHeaderText: __( 'Activate and configure the services that you need', 'newspack' ),
		render: Services,
	},
	{
		path: '/design',
		label: __( 'Design', 'newspack' ),
		subHeaderText: __( 'Customize the look and feel of your site', 'newspack' ),
		render: Design,
	},
	{
		path: '/completed',
		label: __( 'Completed', 'newspack' ),
		render: Completed,
		isHiddenInNav: true,
	},
];

const SetupWizard = ( { wizardApiFetch, setError } ) => {
	return (
		<Fragment>
			{ newspack_aux_data.has_completed_setup && (
				<Notice isWarning>
					{ __(
						'Heads up! The setup has already been completed. No need to run it again.',
						'newspack'
					) }
				</Notice>
			) }
			<HashRouter hashType="slash">
				{ ROUTES.map( ( route, index ) => {
					const nextRoute = ROUTES[ index + 1 ]?.path;
					const buttonAction = nextRoute
						? {
								href: '#' + nextRoute,
						  }
						: {};
					return (
						<Route
							key={ index }
							path={ route.path }
							exact={ route.path === '/' }
							render={ () =>
								route.render( {
									wizardApiFetch,
									setError,
									disableUpcomingInTabbedNavigation: true,
									tabbedNavigation: ROUTES,
									headerText: route.label,
									subHeaderText: route.subHeaderText,
									buttonText: nextRoute ? route.buttonText || __( 'Continue' ) : __( 'Finish' ),
									buttonAction,
								} )
							}
						/>
					);
				} ) }
			</HashRouter>
		</Fragment>
	);
};

render(
	createElement( withWizard( SetupWizard, [] ), { simpleFooter: true } ),
	document.getElementById( 'newspack-setup-wizard' )
);
