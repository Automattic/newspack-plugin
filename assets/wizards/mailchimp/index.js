/**
 * Mailchimp Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizard, WizardPagination } from '../../components/src';
import MailchimpConnectScreen from './views/mailchimpConnectScreen';
import './style.scss';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Wizard for configuring Mailchimp setup.
 */
class MailchimpWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			apiKey: '',
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
		/*
		@todo Implement this endpoint on the backend.
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-mailchimp-wizard/settings' } )
			.then( settings => {
				this.setState( {
					...settings,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
		*/
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { apiKey } = this.state;
		return (
			<HashRouter hashType="slash">
				<WizardPagination />
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<MailchimpConnectScreen
								headerText={ __( 'Connect to Mailchimp' ) }
								subHeaderText={ __( 'Provide your API key to connect Mailchimp to your site' ) }
								onChange={ apiKey => this.setState( { apiKey } ) }
								buttonText={ __( 'Continue' ) }
								buttonAction={ () => console.log( 'Stay tuned for the next exciting episode!' ) }
								apiKey={ apiKey }
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
	createElement( withWizard( MailchimpWizard, [ 'mailchimp-for-woocommerce' ] ), {
		buttonText: __( 'Back to checklist' ),
		buttonAction: newspack_urls[ 'checklists' ][ 'engagement' ],
	} ),
	document.getElementById( 'newspack-mailchimp-wizard' )
);
