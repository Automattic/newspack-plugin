/**
 * Performance Wizard Push Notifications screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToggleControl, ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { TextControl, withWizardScreen } from '../../../../components/src';

/**
 * Description and controls for the Push Notification feature.
 */
class PushNotifications extends Component {
	/**
	 * Render.
	 */
	render() {
		const { settings, updateSetting } = this.props;
		return (
			<Fragment>
				<h4>{ __( 'Keep your users engaged by sending push notifications.' ) }</h4>
				<p>
					{ __(
						'You just published new content and you want to let everyone know? Why not send a push notification? We have an integrated connection to Firebase that lets you manage registered devices and send push notifications to all or selected devices!'
					) }
				</p>
				<ToggleControl
					label={ __( 'Enable Push Notifications' ) }
					onChange={ checked => updateSetting( 'push_notifications', checked ) }
					checked={ settings.push_notifications || false }
				/>
				{ settings.push_notifications && (
					<Fragment>
						<div className="newspack-performance-wizard_indented-block">
							<p>{ __( 'This plugin uses Firebase Cloud Messaging as a messaging service.' ) }</p>
							<ul>
								<li>
									{ __( 'Go to ' ) }
									<ExternalLink href="https://console.firebase.google.com/">
										{ __( 'Firebase Console' ) }
									</ExternalLink>
								</li>
								<li>{ __( 'Click "create new project"' ) }</li>
								<li>{ __( 'Follow the instructions to create your project' ) }</li>
								<li>{ __( 'Now navigate to Project setting page' ) }</li>
								<li>
									{ __(
										'Navigate to Cloud Messaging Tab to get the “Server Key” and “Sender Id”'
									) }
								</li>
							</ul>
						</div>
						<TextControl
							label={ __( 'Server Key' ) }
							value={ settings.push_notification_server_key }
							onChange={ value => updateSetting( 'push_notification_server_key', value ) }
						/>
						<TextControl
							label={ __( 'Sender ID' ) }
							value={ settings.push_notification_sender_id }
							onChange={ value => updateSetting( 'push_notification_sender_id', value ) }
						/>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( PushNotifications, {} );
