/**
 * Performance Wizard.
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
 * Wizard for configuring PWA features.
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
					<p>
						{ __(
							'Newspack utilizes PWA to automatically optomizing and configuring your news site to perform better. It improves:'
						) }
					</p>
					<h2>{ __( 'Speed' ) }</h2>
					<p>{ __( 'Will work reliably, no matter the network conditions.' ) }</p>
					<h2>{ __( 'Security' ) }</h2>
					<p>
						{ __(
							'Served from a secure origin through HTTPS, which will protect the integrity of your news site.'
						) }
					</p>
					<h2>{ __( 'User Experience' ) }</h2>
					<p>
						{ __( 'Feels like a natural app on the device, with an immersive user experience.' ) }
					</p>
				</Card>
				<Card>
					<h2>{ __( 'Advanced Options' ) }</h2>
					<p>
						{ __(
							'Increase engagement with your audience by implementing the following advanced options:'
						) }
					</p>
					<ul>
						<li>{ __( 'Add to homescreen' ) }</li>
						<li>{ __( 'Offline usage' ) }</li>
						<li>{ __( 'Push notifications' ) }</li>
					</ul>
				</Card>
			</Fragment>
		);
	}
}

export default withWizardScreen( Intro, {} );
