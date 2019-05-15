/**
 * Subscriptions Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ManageSubscriptionsScreen from './views/manageSubscriptionsScreen';
import './style.scss';

/**
 * Subscriptions wizard stub for example purposes.
 */
class SubscriptionsWizard extends Component {

	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			screen: ManageSubscriptionsScreen,
			screenArgs: [],
		}
	}

	/**
	 * Change the current active screen.
	 */
	changeScreen( screen, args ) {
		this.setState( {
			screen: screen,
			screenArgs: args || [],
		} );
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const Screen = this.state.screen;
		const { screenArgs } = this.state;

		return(
			<Screen { ...screenArgs } changeScreen={ ( screen, args ) => this.changeScreen( screen, args ) } />
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
