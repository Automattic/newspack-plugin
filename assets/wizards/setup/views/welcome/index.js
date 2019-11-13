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
				<p>{ __( 'The following wizard will help you with the set up.' ) }</p>
				<p>{ __( 'Clicking “Get started” will install core Newspack plugins and the theme in the background.') }</p>
			</div>
		);
	}
}

export default withWizardScreen( Welcome );
