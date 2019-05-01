/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxInput from '../../components/checkboxInput';

/**
 * Subscriptions wizard stub for example purposes.
 */
class SubscriptionsWizard extends Component {

	/**
	 * Render the example stub.
	 */
	render() {
		return(
			<CheckboxInput
		        label="Checkbox is tested?"
		        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
			/>
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
