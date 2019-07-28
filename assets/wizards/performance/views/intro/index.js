/**
 * Performance Wizard Intro screen
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dashicon, ExternalLink } from '@wordpress/components';

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
			<Fragment>
				<h4><Dashicon icon="info" /> { __( 'Your site performance has been enhanced automatically' ) }</h4>
				<p>
					{ __( 'Newspack utilizes ' ) }
					<ExternalLink href="#">{ __( 'Progressive Web App' ) }</ExternalLink>
					{ __(
						'(PWA) to automatically optimizing and configuring your news site to perform better. It automatically improves:'
					) }
				</p>
				<p>
					<strong>{ __( 'Speed:' ) }</strong>{' '}
					{ __( 'Will work reliably, no matter the network conditions.' ) }
					<br />
					<strong>{ __( 'Security:' ) }</strong>{' '}
					{ __( 'Served through HTTPS to protect the integrity of your news site.' ) }
					<br />
					<strong>{ __( 'User Experience:' ) }</strong>{' '}
					{ __( 'Feels like a native app on the device.' ) }
					<br />
				</p>
			</Fragment>
		);
	}
}

export default withWizardScreen( Intro, {} );
