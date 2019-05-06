/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxInput from '../../components/checkboxInput';
import Card from '../../components/card';
import InputText from '../../components/inputText';

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
				<Card>
					<CheckboxInput
				        label="Checkbox is tested?"
				        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
					/>
				</Card>
				<Card>
					<CheckboxInput
				        label="Checkbox w/Tooltip"
				        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
				        tooltip="This is tooltip text"
					/>
				</Card>
				<Card>
					<InputText
					      label="Text Input with value"
					      value="Some value"
					/>
				</Card>
				<Card>
					<InputText
					      label="Empty Text Input"
					/>
				</Card>
				<Card>
					<InputText
					      label="Disabled Text Input"
					      disabled
					/>
				</Card>

			</Fragment>
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);

