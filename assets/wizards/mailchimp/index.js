/**
 * Mailchimp Wizard.
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
import JetpackMailchimpWizard from './views/jetpackMailchimpWizard';
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
			wizard: 'unknown',
			jetpackSettings: {
				connected: false,
				connectURL: '',
			},
			woocommerceSettings: {

			}
		};
	}

	/**
	 * Figure out whether to use the WooCommerce or Jetpack Mailchimp wizards and get appropriate settings.
	 */
	onWizardReady = () => {
		this.determineWizard().then( () => this.getSettings() );
	};

	/**
	 * Figure out whether to use the WooCommerce-based or Jetpack-based Mailchimp setup.
	 */
	determineWizard() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/plugins/woocommerce' } )
			.then( info => {
				if ( 'active' === info['Status'] ) {
					this.setState( {
						wizard: 'woocommerce',
					} );
				} else {
					this.setState( {
						wizard: 'jetpack',
					} );
				}
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Get settings for the current wizard.
	 */
	getSettings() {
		const { wizard } = this.state;
		
		if ( 'jetpack' === wizard ) {
			this.getJetpackMailchimpSettings();
		} else if ( 'woocommerce' === wizard ) {
			this.getWooCommerceMailchimpSettings();
		}
	}

	/**
	 * Get Jetpack-based Mailchimp setup settings.
	 */
	getJetpackMailchimpSettings() {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-mailchimp-wizard/jetpack' } )
			.then( jetpackSettings => {
				this.setState( {
					jetpackSettings,
				} );
			} )
			.catch( error => {
				setError( error );
			} );
	}

	/**
	 * Get WooCommerce-based Mailchimp setup settings.
	 */
	getWooCommerceMailchimpSettings() {
		console.log( 'TODO' );
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { wizard, jetpackSettings } = this.state;
		return (
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ routeProps => (
							<Fragment>
								{ 'jetpack' === wizard && (
									<JetpackMailchimpWizard
										headerText={ __( 'Set up Mailchimp' ) }
										subHeaderText={ __( 'Integrate Mailchimp with your newsroom' ) }
										noBackground
										{ ...jetpackSettings }
									/>
								) }
								{ 'woocommerce' === wizard && (
									<h1>TODO: WooCommerce branch of the wizard</h1>
								) }
							</Fragment>
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( MailchimpWizard ), {
		buttonText: __( 'Back to checklist' ),
		buttonAction: newspack_urls['checklists']['engagement'],
	} ),
	document.getElementById( 'newspack-mailchimp-wizard' )
);
