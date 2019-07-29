/**
 * Performance Wizard Add To Homescreen screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { CheckboxControl, ImageUpload, withWizardScreen } from '../../../../components/src';

/**
 * Description and controls for the Add To Homescreen feature.
 */
class AddToHomeScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const { updateSetting, settings } = this.props;
		return (
			<Fragment>
				<h4>{ __( 'Encourage your users to add your news site to their homescreen. ' ) }</h4>
				<p>
					{ __(
						'With this feature you are able to display an "add to homescreen" prompt. This way your news site gets a prominent place on the users homescreen right next to the native apps.'
					) }
				</p>
				<ToggleControl
					label={ __( 'Enable “Add to homescreen” button' ) }
					onChange={ checked => updateSetting( 'add_to_homescreen', checked ) }
					checked={ settings.add_to_homescreen || false }
					tooltip={ __(
						'The mobile browser will show a mini-infobar which opens the install prompt'
					) }
				/>
				{ settings.add_to_homescreen && (
					<div className="newspack-performance-wizard_indented-block">
						<p>
							<em>{ __( 'Site icons should be square and at least 512 × 512 pixels.' ) }</em>
						</p>
						<ImageUpload
							image={ settings.site_icon }
							onChange={ image => updateSetting( 'site_icon', image ) }
							uploadPrompt={ __( 'Add site icon' ) }
						/>
					</div>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( AddToHomeScreen, {} );
