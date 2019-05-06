/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CheckboxInput from '../../components/checkboxInput';
import ImageUpload from '../../components/ImageUpload';
import Card from '../../components/card';

/**
 * Subscriptions wizard stub for example purposes.
 */
class SubscriptionsWizard extends Component {

	constructor( props ) {
		super( ...arguments );
		this.state = {
			image: null,
		}
	}

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
					<ImageUpload 
						image={ this.state.image } 
						onChange={ image => { 
							this.setState( { image } );
							console.log( 'Image:' );
							console.log( image );
						} }
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
