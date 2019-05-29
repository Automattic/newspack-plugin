/**
 * "Components Demo" Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';


/**
 * Internal dependencies
 */
import { FormattedHeader } from '../../../components';

/**
 * Components demo for example purposes.
 */
class GoogleAdSense extends Component {
	/**
	 * Render the example stub.
	 */
	render() {
		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'Google AdSense' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising with AdSense from Google.' ) }
				/>
			</Fragment>
		);
	}
}

export default GoogleAdSense;
