/**
 * UGC screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Placeholder } from '@wordpress/components';
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

		return <Placeholder>User Generated Content features TK.</Placeholder>;
	}
}

export default withWizardScreen( UGC );
