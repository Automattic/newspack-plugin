/**
 * Mailchimp Block Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard } from '../../components/src';
import MailchimpBlockSetup from './views/mailchimpBlockSetup';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Wizard for configuring newsletter block setup.
 */
class NewsletterBlockWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			connected: false,
			connectURL: '',
		};
	}

	/**
	 * Figure out whether to use the WooCommerce or Jetpack Mailchimp wizards and get appropriate settings.
	 */
	onWizardReady = () => {
		this.getSettings();
	};

	/**
	 * Get settings for the current wizard.
	 */
	getSettings() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-newsletter-block-wizard/connection-status' } )
			.then( info => {
				this.setState( {
					...info,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { connected, connectURL } = this.state;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<MailchimpBlockSetup
								headerText={ __( 'Set up newsletter subscription block' ) }
								subHeaderText={ __( 'Capture Mailchimp newsletter signups from within your content' ) }
								noBackground
								connected={ connected }
								connectURL={ connectURL }
							/>
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( NewsletterBlockWizard, [ 'jetpack' ] ), {
		buttonText: __( 'Back to checklist' ),
		buttonAction: newspack_urls['checklists']['engagement'],
	} ),
	document.getElementById( 'newspack-newsletter-block-wizard' )
);
