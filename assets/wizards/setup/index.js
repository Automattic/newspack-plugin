import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Fragment, render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Welcome, Settings, Services, Integrations, Design } from './views/';
import { withWizard } from '../../components/src';
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
		render: Settings,
	},
	{
		path: '/integrations',
		label: __( 'Integrations', 'newspack' ),
		render: Integrations,
	},
	{
		path: '/services',
		label: __( 'Services', 'newspack' ),
		render: Services,
	},
	{
		path: '/design',
		label: __( 'Design', 'newspack' ),
		render: Design,
	},
];

const SetupWizard = ( { wizardApiFetch, setError } ) => {
	const finishSetup = () => {
		const params = {
			path: `/newspack/v1/wizard/newspack-setup-wizard/complete`,
			method: 'POST',
			quiet: true,
		};
		wizardApiFetch( params )
			.then( () => ( window.location = newspack_urls.dashboard ) )
			.catch( setError );
	};

	const sharedProps = {
		wizardApiFetch,
		setError,
		disableUpcomingInTabbedNavigation: true,
		tabbedNavigation: ROUTES,
	};

	return (
		<Fragment>
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
									...sharedProps,
									headerText: route.label,
									subHeaderText: route.subHeaderText,
									buttonText: nextRoute ? route.buttonText || __( 'Continue' ) : __( 'Finish' ),
									buttonAction,
									onSave: nextRoute ? null : finishSetup,
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
