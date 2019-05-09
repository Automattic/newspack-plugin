/**
 * Subscriptions Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxInput from '../../components/checkboxInput';
import Card from '../../components/card';
import NewspackButton from '../../components/button';
import FormattedHeader from '../../components/formattedHeader';
import InputText from '../../components/InputText';
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
			inputTextValue1: "Input value",
			inputTextValue2: ""
		}
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const { inputTextValue1, inputTextValue2 } = this.state;

		return(
			<Fragment>
				<FormattedHeader
					headerText="Newspack Components"
					subHeaderText="Temporary demo of Newspack components"
				/>
				<Card>
					<FormattedHeader
						headerText="Checkboxes"
					/>
					<CheckboxInput
				        label="Checkbox is tested?"
				        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
					/>
					<CheckboxInput
				        label="Checkbox w/Tooltip"
				        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
				        tooltip="This is tooltip text"
					/>
				</Card>
				<Card>
					<FormattedHeader
						headerText="Text Inputs"
					/>
					<InputText
						label="Text Input with value"
						value={ inputTextValue1 }
						onChange={ value => this.setState( { inputTextValue1: value } ) }
					/>
					<InputText
						label="Text Input empty"
						value={ inputTextValue2 }
						onChange={ value => this.setState( { inputTextValue2: value } ) }
					/>
					<InputText
						label="Text Input disabled"
						disabled
					/>
				</Card>

				<NewspackButton isPrimary value="Continue" />
			</Fragment>
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
