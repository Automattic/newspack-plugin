/**
 * Back button and pagination for Wizards
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Children } from '@wordpress/element';

/**
 * External dependencies
 */
import { HashRouter, Switch } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { WizardNavigation, WizardPagination } from '../';

class WizardRouter extends Component {

	/**
	 * Render.
	 */
	render() {
		const { children, pagination } = this.props;
		const routes = Children.toArray( children ).filter( child => 'Route' === child.type.name ).map( child => child.props.path );
		return (
			<HashRouter hashType="slash" { ...this.props }>
				{ pagination && <WizardPagination routes={ routes } /> }
				{ pagination && <WizardNavigation /> }
				<Switch>
					{ children }
				</Switch>
			</HashRouter>
		);
	}
}

export default WizardRouter;
