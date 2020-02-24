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
import HeaderIcon from '@material-ui/icons/Search';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { PaymentMethod } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

class PaymentWizard extends Component {
	state = {
		customer: {},
	};
	componentDidMount = props => {
		this.retrieve();
	};
	retrieve = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-payment-wizard/' } )
			.then( ( { customer } ) => this.setState( { customer } ) )
			.catch( error => setError( error ) );
	};
	checkout = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( { path: '/newspack/v1/wizard/newspack-payment-wizard/checkout' } )
			.then( data => {
				const stripe = Stripe( data.stripe_publishable_key );
				stripe
					.redirectToCheckout( {
						// Make the id field from the Checkout Session creation API response
						// available to this file, so you can provide it as parameter here
						// instead of the {{CHECKOUT_SESSION_ID}} placeholder.
						sessionId: data.session_id,
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
		const { customer } = this.state;
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
									headerText={ __( 'Payment' ) }
									subHeaderText={ __( 'Manage payment methods for hosted Newspack.' ) }
									customer={ customer }
									buttonText={ customer ? __( 'Update subscription', 'newspack' ) : __( 'Subscribe', 'newspack' ) }
									buttonAction={ this.checkout }
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
