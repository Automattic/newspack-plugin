/**
 * UGC screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, withWizardScreen } from '../../../../components/src';

/**
 * UGC Screen
 */
class UGC extends Component {
	/**
	 * Render.
	 */
	render() {
		const { connected, connectURL } = this.props;

		return (
			<Card>
				<p>User Generated Content features TK.</p>
			</Card>
		);
	}
}

export default withWizardScreen( UGC );
