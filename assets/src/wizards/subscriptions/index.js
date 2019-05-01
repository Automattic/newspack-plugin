/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { Button } from '@wordpress/components';

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
			<Fragment>
				<CheckboxInput
			        label="Checkbox"
			        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
				/>
				<CheckboxInput
			        label="Checkbox w/Tooltip"
			        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
			        tooltip="This is tooltip text"
				/>
			</Fragment>
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
