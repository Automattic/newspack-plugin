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
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class SubscriptionsWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			screen: ManageSubscriptionsScreen,
			screenArgs: [],
		};
	}

	/**
	 * Change the current active screen.
	 *
	 * @param object screen React class for screen to load.
	 * @param object args   Dictionary of params to pass to screen as props.
	 */
	changeScreen( screen, args ) {
		this.setState( {
			screen: screen,
			screenArgs: args || [],
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const Screen = this.state.screen;
		const { screenArgs } = this.state;

		return (
			<Screen
				{ ...screenArgs }
				changeScreen={ ( screen, args ) => this.changeScreen( screen, args ) }
			/>
		);
	}
}

render( <SubscriptionsWizard />, document.getElementById( 'newspack-subscriptions-wizard' ) );
