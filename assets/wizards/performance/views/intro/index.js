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
import { Card, withWizardScreen, Grid, ImageUpload } from '../../../../components/src';

/**
 * Intro screen for Performnance Wizard
 */
class Intro extends Component {
	/**
	 * Render.
	 */
	render() {
		const { updateSetting, settings } = this.props;
		return (
			<Grid>
				<Card>
					<h3>{ __( 'Increase user engagement' ) }</h3>
					<p>
						{ __( 'Engage with your audience more by letting them add the site to their home screen and use it offline.' ) }
					</p>
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
						<p className="newspack-plugin-description">
							<strong>
								{ __( 'PWA options have been automatically set up for you.' ) }
							</strong>
						</p>
					</div>
					<div className='newspack-performance-wizard__status'>
						<h3>{ __( 'Status' ) }</h3>
						{ settings.configured && (
							<div className='notice notice-success'>{ __( 'PWA is configured and working.' ) }</div>
						) }
						{ ! settings.configured && settings.error && (
							<div className='notice notice-error'>
								{ settings.error }
							</div>
						) }
					</div>
				</Card>
				<Card>
					<h3>{ __( 'Site icon' ) }</h3>
					<div className="newspack-performance-wizard__info-block dashicons-before dashicons-info">
						<p>{ __( 'Your site icon is the icon your site has when installed as an app.' ) }</p>
						<p><em>{ __( 'Site icons should be square and at least 144 × 144 pixels.' ) }</em></p>
						<ImageUpload
							image={ settings.site_icon }
							onChange={ image => updateSetting( 'site_icon', image ) }
						/>
					</div>
				</Card>
			</Grid>
		);
	}
}

export default withWizardScreen( Intro, {} );
