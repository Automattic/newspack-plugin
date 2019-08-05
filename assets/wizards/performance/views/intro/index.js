/**
 * Performance Wizard Intro screen
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
import { Card, withWizardScreen, Grid } from '../../../../components/src';

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
			<Grid>
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
							{ __( 'Will work reliably, no matter the network conditions.' ) }
							<br />
							<strong>{ __( 'Security: ' ) }</strong>
							{ __( 'Served through HTTPS to protect the integrity of your news site.' ) }
							<br />
							<strong>{ __( 'User experience:  ' ) }</strong>
							{ __( 'Feels like a native app on the device.' ) }
						</p>
					</div>
					<p className="newspack-plugin-description">
						{ __(
							'Basic PWA options have been automatically set up for you. Advanced options are available in the Progressive WP dashboard.'
						) }
						<ExternalLink href="/wp-admin/admin.php?page=progressive-wordpress">
							{ __( 'Configure advanced options', 'newspack' ) }
						</ExternalLink>
					</p>
				</Card>
			</Grid>
		);
	}
}

export default withWizardScreen( Intro, {} );
