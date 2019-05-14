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
			screen: 'manageSubscriptionsScreen',
		}
	}

	/**
	 * Render the example stub.
	 */
	render() {
		return(
			<ManageSubscriptionsScreen />
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
