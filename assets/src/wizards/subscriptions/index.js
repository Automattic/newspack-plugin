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
import { ButtonGroup } from '@wordpress/components';

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
				<NewspackButton isPrimary />
			</Fragment>
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
