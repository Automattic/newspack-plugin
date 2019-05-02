/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxInput from '../../components/checkboxInput';
import ImageUpload from '../../components/ImageUpload';

/**
 * Subscriptions wizard stub for example purposes.
 */
class SubscriptionsWizard extends Component {

	/**
	 * Render the example stub.
	 */
	render() {
		return(
			<div>
				<CheckboxInput
			        label="Checkbox is tested?"
			        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
				/>
				<ImageUpload onChange={ function( data ){ console.log( 'Set image: ' + data.image_id ); } } />
			</div>
		);
	}
}

render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
