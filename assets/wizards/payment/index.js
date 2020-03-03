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
		hasData: false,
	};
	componentDidMount = () => {
		this.retrieve();
	};
	retrieve = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-payment-wizard/' } )
			.then( ( { card, customer, subscription } ) =>
				this.setState( { card, customer, subscription, hasData: true } )
			)
			.catch( error => setError( error ) );
	};
	checkout = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-payment-wizard/checkout' } )
			.then( async data => {
				const { stripe_publishable_key: stripePublishableKey, session_id: sessionId } = data;
				const stripe = await loadStripe( stripePublishableKey );
				stripe.redirectToCheckout( { sessionId } );
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
		const { card, customer, hasData, subscription } = this.state;
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
									buttonText={ needsSubscription ? __( 'Subscribe', 'newspack' ) : null }
									buttonAction={ this.checkout }
									card={ card }
									hasData={ hasData }
									headerIcon={ <HeaderIcon /> }
									headerText={ __( 'Managed Newspack' ) }
									onUpdateSubscription={ this.checkout }
									subHeaderText={ __( 'Manage payment methods for hosted Newspack.' ) }
									subscription={ subscription }
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
