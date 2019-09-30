/**
 * Social screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ActionCard, Card, Button, withWizardScreen } from '../../../../components/src';

/**
 * Social Screen
 */
class Social extends Component {
	/**
	 * Render.
	 */
	render() {
		const { connected, connectURL } = this.props;

		return (
			<ActionCard
				title={ __( 'Jetpack Publicize' ) }
				description={ __(
					'Description TK.'
				) }
				actionText={ __( 'Configure' ) }
				handoff="jetpack"
				editLink="admin.php?page=jetpack#/sharing"
			/>
		);
	}
}

export default withWizardScreen( Social );
