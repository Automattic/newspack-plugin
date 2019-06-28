/**
 * Google Ad Manager Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard, FormattedHeader, Handoff } from '../../components/src';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class GoogleAdManagerWizard extends Component {

	render() {
		const { pluginRequirements } = this.props;
		return (
			<HashRouter hashType="slash">
				<Switch>
					<Fragment>
						<FormattedHeader
							headerText={ __( 'Add an ad unit' ) }
							subHeaderText={ __( 'Set up ad units you can reuse within WordPress.' ) }
						/>
					</Fragment>
				</Switch>
			</HashRouter>
		);
	}

}

render(
	createElement(
		withWizard( GoogleAdManagerWizard ),
		{
			buttonText: __( 'Back to checklist' ),
			buttonAction: newspack_urls[ 'checklists' ][ 'advertising' ],
		}
	),
	document.getElementById( 'newspack-google-ad-manager-wizard' )
);
