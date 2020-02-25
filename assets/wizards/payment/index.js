/**
 * Payment
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Dns';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { PaymentMethod } from './views';

/**
 * External dependencies.
 */
import { loadStripe } from '@stripe/stripe-js';

const { HashRouter, Redirect, Route, Switch } = Router;

class PaymentWizard extends Component {
	state = {
		customer: {},
	};
	componentDidMount = () => {
		this.retrieve();
	};
	retrieve = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-payment-wizard/' } )
			.then( ( { customer, subscription } ) => this.setState( { customer, subscription } ) )
			.catch( error => setError( error ) );
	};
	checkout = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-payment-wizard/checkout' } )
			.then( async data => {
				const { stripe_publishable_key: stripePublishableKey, session_id: sessionId } = data;
				const stripe = await loadStripe( stripePublishableKey );
				stripe
					.redirectToCheckout( {
						// Make the id field from the Checkout Session creation API response
						// available to this file, so you can provide it as parameter here
						// instead of the {{CHECKOUT_SESSION_ID}} placeholder.
						sessionId: sessionId,
					} )
					.then( function( result ) {
						// If `redirectToCheckout` fails due to a browser or network
						// error, display the localized error message to your customer
						// using `result.error.message`.
					} );
			} )
			.catch( error => {
				setError( error );
			} );
	};
	/**
	 * Render
	 */
	render() {
		const { pluginRequirements } = this.props;
		const { customer, subscription } = this.state;
		const needsSubscription =
			! customer || customer.deleted || ( ! subscription || 'canceled' === subscription.status );
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							exact
							path="/"
							render={ () => (
								<PaymentMethod
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Managed Newspack' ) }
									subHeaderText={ __( 'Manage payment methods for hosted Newspack.' ) }
									customer={ customer }
									buttonText={ needsSubscription ? __( 'Subscribe', 'newspack' ) : null }
									buttonAction={ this.checkout }
									onUpdateSubscription={ this.checkout }
								/>
							) }
						/>
						<Redirect to="/" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( PaymentWizard ) ),
	document.getElementById( 'newspack-payment-wizard' )
);
