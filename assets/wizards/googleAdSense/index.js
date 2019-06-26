/**
 * Google AdSense Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard, FormattedHeader } from '../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class GoogleAdSenseWizard extends Component {

	render() {
		const { pluginRequirements } = this.props;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Fragment>
								<FormattedHeader
									headerText={ __( 'Google AdSense' ) }
									subHeaderText={ __( 'Work, please.' ) }
								/>
							</Fragment>
						) }
					/>
				</Switch>
			</HashRouter>
		);
	}

}

render(
	createElement(
		withWizard( GoogleAdSenseWizard, [
			'google-site-kit',
		] ),
		{
			buttonText: __( 'Back to checklist' ),
			buttonAction: newspack_urls[ 'checklists' ][ 'advertising' ],
		}
	),
	document.getElementById( 'newspack-google-adsense-wizard' )
);
