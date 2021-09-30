import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { withWizard, withWizardScreen } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { Main } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const MainScreen = withWizardScreen( Main );

const ConnectionsWizard = ( { pluginRequirements, wizardApiFetch, startLoading, doneLoading } ) => {
	const wizardScreenProps = {
		headerText: __( 'Connections', 'newspack' ),
		subHeaderText: __( 'Connections to third-party services', 'newspack' ),
		wizardApiFetch,
		startLoading,
		doneLoading,
	};
	return (
		<HashRouter hashType="slash">
			<Switch>
				{ pluginRequirements }
				<Route exact path="/" render={ () => <MainScreen { ...wizardScreenProps } /> } />
				<Redirect to="/" />
			</Switch>
		</HashRouter>
	);
};

render(
	createElement( withWizard( ConnectionsWizard ) ),
	document.getElementById( 'newspack-connections-wizard' )
);
