/**
 * Syndication Intro View
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';

/**
 * Syndication Intro screen.
 */
class Intro extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<ActionCard
					title={ __( 'Apple News' ) }
					description={ __(
						'Description TK'
					) }
					actionText={ __( 'Configure' ) }
				/>
				<ActionCard
					title={ __( 'Facebook Instant Articles' ) }
					description={ __(
						'Description TK'
					) }
					actionText={ __( 'Configure' ) }
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( Intro );
