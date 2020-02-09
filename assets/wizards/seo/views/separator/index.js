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
 * SEO Separator screen.
 */
class Separator extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<h2>Title Separator</h2>
			</Fragment>
		);
	}
}

export default withWizardScreen( Separator );
