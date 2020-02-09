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
 * SEO Environment screen.
 */
class Environment extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<h2>Environment</h2>
			</Fragment>
		);
	}
}

export default withWizardScreen( Environment );
