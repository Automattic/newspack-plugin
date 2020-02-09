/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';

/**
 * SEO Tools screen.
 */
class Tools extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<h2>Webmaster tools verification</h2>
			</Fragment>
		);
	}
}

export default withWizardScreen( Tools );
