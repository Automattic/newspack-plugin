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
 * SEO Social screen.
 */
class Social extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<h2>Social</h2>
			</Fragment>
		);
	}
}

export default withWizardScreen( Social );
