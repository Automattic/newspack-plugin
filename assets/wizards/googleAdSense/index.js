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
import { withWizard, FormattedHeader, Handoff } from '../../components/src';
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
					<Handoff
						plugin='google-site-kit'
						editPath='admin.php?page=googlesitekit-module-adsense'
						modalTitle={ __( 'Google SiteKit' ) }
						modalBody={ __( 'Google AdSense can be configured with the Google SiteKit plugin.' ) }
						primaryButton={ __( 'Manage SiteKit' ) }
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
