/**
 * Components Demo/Wizard stub.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ImageUpload from '../../components/ImageUpload';
import CheckboxControl from '../../components/checkboxControl';
import Card from '../../components/card';
import FormattedHeader from '../../components/formattedHeader';
import TextControl from '../../components/textControl';
import ProgressBar from '../../components/progressBar';

/**
 * Subscriptions wizard stub for example purposes.
 */
class ComponentsDemo extends Component {

	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			inputTextValue1: "Input value",
			inputTextValue2: "",
			image: null,
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
					<CheckboxControl
				        label="Checkbox is tested?"
				        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
					/>
					<CheckboxControl
				        label="Checkbox w/Tooltip"
				        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
				        tooltip="This is tooltip text"
					/>
				</Card>
				<Card>
					<FormattedHeader
						headerText="Image Uploader"
					/>
					<ImageUpload
						image={ this.state.image }
						onChange={ image => {
							this.setState( { image } );
							console.log( 'Image:' );
							console.log( image );
						} }
					/>
				</Card>
				<Card>
					<FormattedHeader
						headerText="Text Inputs"
					/>
					<TextControl
						label="Text Input with value"
						value={ inputTextValue1 }
						onChange={ value => this.setState( { inputTextValue1: value } ) }
					/>
					<TextControl
						label="Text Input empty"
						value={ inputTextValue2 }
						onChange={ value => this.setState( { inputTextValue2: value } ) }
					/>
					<TextControl
						label="Text Input disabled"
						disabled
					/>
				</Card>
				<Card>
					<FormattedHeader
						headerText="Progress bar"
					/>
					<ProgressBar completed="2" total="3" />
					<ProgressBar completed="2" total="5" label="Progress made" />
					<ProgressBar completed="0" total="5" displayFraction />
					<ProgressBar completed="3" total="8" label="Progress made" displayFraction />
				</Card>
			</Fragment>
		);
	}
}

render(
  <ComponentsDemo />,
  document.getElementById( 'newspack-components-demo' )
);
