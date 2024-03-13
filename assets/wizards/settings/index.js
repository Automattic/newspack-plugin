/**
 * Settings
 */

// Webpack.
import '../../shared/js/public-path';

/**
 * Dependencies.
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { Fragment, createElement, render } from '@wordpress/element';
// Internal
import { Connections } from './views';
import { withWizardScreen } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';

const { HashRouter, Redirect, Route, Switch } = Router;

const ComingSoon = () => {
	return <p>🚧 @TODO - Coming Soon! 🚧</p>;
};

const tabbedNavigation = [
	{
		label: __( 'Connections' ),
		path: '/connections',
		component: Connections,
		exact: true,
	},
	{
		label: __( 'Emails' ),
		path: '/emails',
		component: ComingSoon,
		exact: true,
	},
	{
		label: __( 'Social' ),
		path: '/social',
		component: ComingSoon,
		exact: true,
	},
	{
		label: __( 'Syndication' ),
		path: '/syndication',
		component: ComingSoon,
		exact: true,
	},
	{
		label: __( 'SEO' ),
		path: '/seo',
		component: ComingSoon,
		exact: true,
	},
	{
		label: __( 'Theme and Brand' ),
		path: '/theme-and-brand',
		component: ComingSoon,
		exact: true,
	},
	{
		label: __( 'Display Settings' ),
		path: '/display-settings',
		component: ComingSoon,
		exact: true,
	},
	{
		label: __( 'Additional Brands' ),
		path: '/additional-brands',
		component: ComingSoon,
		exact: true,
	},
];

const SettingsSectionTitle = ( { title } ) => <h1>{ title }</h1>;

const SettingsPage = ( { pluginRequirements, setError, wizardApiFetch } ) => (
	<Fragment>
		<HashRouter hashType="slash">
			<Switch>
				{ pluginRequirements }
				{ tabbedNavigation.map( ( { path, exact, label, component: Component } ) => {
					return (
						<Route
							key={ path }
							path={ path }
							exact={ exact }
							render={ () => {
								if ( ! Component ) {
									return null;
								}
								const WrappedWithWizardScreen = withWizardScreen( Component );
								return (
									<WrappedWithWizardScreen
										headerText={ __( 'Newspack / Settings' ) }
										renderAboveContent={ () => <SettingsSectionTitle title={ label } /> }
										tabbedNavigation={ tabbedNavigation }
										wizardApiFetch={ wizardApiFetch }
										setError={ setError }
										isPartOfSetup={ false }
									/>
								);
							} }
						/>
					);
				} ) }
				<Redirect to="/connections" />
			</Switch>
		</HashRouter>
	</Fragment>
);

render( createElement( SettingsPage ), document.getElementById( 'newspack-settings-wizard' ) );
