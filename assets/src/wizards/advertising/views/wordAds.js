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
class WordAds extends Component {
	/**
	 * Render the example stub.
	 */
	render() {
		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'WordAds from WordPress.com' ) }
					subHeaderText={ __( 'Enhance your Newspack site with advertising with WordAds from WordPress.com.' ) }
				/>
			</Fragment>
		);
	}
}

export default WordAds;
