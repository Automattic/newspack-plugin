/**
 * Native Commenting screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Disqus dependencies
 */
import { Card, withWizardScreen } from '../../../../components/src';

/**
 * Native Commenting Screen
 */
class CommentingNative extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Card>
				<p>WordPress Native Commenting screen TK</p>
			</Card>
		);
	}
}

export default withWizardScreen( CommentingNative );
