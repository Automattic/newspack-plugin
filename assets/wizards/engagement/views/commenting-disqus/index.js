/**
 * Disqus screen.
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
 * Commenting Screen
 */
class CommentingDisqus extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Card>
				<p>Disqus screen TK</p>
			</Card>
		);
	}
}

export default withWizardScreen( CommentingDisqus );
