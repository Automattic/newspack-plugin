/**
 * The Coral Project screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * The Coral Project dependencies
 */
import { Card, withWizardScreen } from '../../../../components/src';

/**
 * Commenting Screen
 */
class CommentingCoral extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Card>
				<p>The Coral Project screen TK</p>
			</Card>
		);
	}
}

export default withWizardScreen( CommentingCoral );
