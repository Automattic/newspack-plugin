/**
 * Location setup Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * Location Setup Screen.
 */
class Welcome extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<div className="newspack-setup-wizard__welcome">
				<p>{ __( 'The following wizard will help you set up Newspack.' ) }</p>
				<div className="newspack-setup-wizard_image_container" />
				<p>
					'Newspack brings together the power of a suite of plugins. We will install the following
					core plugins and themes automatically for you: Gutenberg, Jetpack, Site Kit, AMP, PWA,
					Newspack Blocks, Advanced Custom Fields, and the flexible Newspack Theme.{' '}
					<a href="#">Learn more</a>
				</p>
			</div>
		);
	}
}

export default withWizardScreen( Welcome );
