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
class GoogleAdManager extends Component {
	/**
	 * Render the example stub.
	 */
	render() {
		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'Google Ad Manager' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising with Ad Manager from Google.' ) }
				/>
			</Fragment>
		);
	}
}

export default GoogleAdManager;
