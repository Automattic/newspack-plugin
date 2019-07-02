/**
 * Performance Wizard Intro screen
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
 * Intro screen for Performnance Wizard
 */
class Intro extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		return (
			<Fragment>
				<Card>
					<h3>{ __( 'Increase user engagement' ) }</h3>
					<p>
						{ __(
							'Engage with your audience more by implementing the following advanced features (optional): '
						) }
						<strong>{ __( 'Add to home screen' ) }</strong>
						{ __( ', ' ) }
						<strong>{ __( 'Offline usage' ) }</strong>
						{ __( ', and ' ) }
						<strong>{ __( 'Push notifications' ) }</strong>.

					</p>
				</Card>
				<Card>
					<h3>{ __( 'Automatic performance enhancements' ) }</h3>
					<div className="newspack-performance-wizard__info-block dashicons-before dashicons-info">
						<p>
							{ __(
								'Newspack utilizes Progressive Web App (PWA) to automatically optimize and configure your news site to perform better. It automatically improves:'
							) }
						</p>
						<p>
							<strong>{ __( 'Speed: ' ) }</strong>
							{ __(
								'Will work reliably, no matter the network conditions.'
							) }<br />
							<strong>{ __( 'Security: ' ) }</strong>
							{ __(
								'Served through HTTPS to protect the integrity of your news site.'
							) }<br />
							<strong>{ __( 'User experience:  ' ) }</strong>
							{ __(
								'Feels like a native app on the device.'
							) }
						</p>
					</div>
				</Card>
			</Fragment>
		);
	}
}

export default withWizardScreen( Intro, {} );
