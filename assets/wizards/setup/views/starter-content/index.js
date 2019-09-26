/**
 * Starter Content Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar, withWizardScreen } from '../../../../components/src';

/**
 * Location Setup Screen.
 */
class StarterContent extends Component {
	/**
	 * Render.
	 */
	render() {
		const { starterContentProgress, starterContentTotal } = this.props;
		return (
			<div className="newspack-setup-wizard__welcome">
				<p>{ __( 'Click Install to prepopulate the site with categories, posts, and a homepage.' ) }</p>
				{ starterContentProgress > 0 && starterContentTotal > 0 && (
					<ProgressBar
						completed={ starterContentProgress }
						total={ starterContentTotal }
						displayFraction
					/>
				) }
			</div>
		);
	}
}

export default withWizardScreen( StarterContent );
