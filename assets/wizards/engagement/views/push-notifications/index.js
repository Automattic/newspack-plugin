/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginToggle, TextControl, withWizardScreen } from '../../../../components/src';

/**
 * Push Notifications screen.
 */
class PushNotifications extends Component {
	state = {
		pushNotificationEnabled: false,
	};
	/**
	 * Render.
	 */
	render() {
		const { pushNotificationEnabled } = this.state;
		const { data, onChange, setPushNotificationEnabled } = this.props;
		const { app_id: appId, app_rest_api_key: appRestAPIKey } = data;
		return (
			<Fragment>
				<PluginToggle
					onReady={ pluginInfo => {
						const { 'onesignal-free-web-push-notifications': oneSignal } = pluginInfo;
						const { Status: status } = oneSignal || {};
						this.setState(
							{
								pushNotificationEnabled: 'active' === status,
							},
							() => setPushNotificationEnabled( this.state.pushNotificationEnabled )
						);
					} }
					plugins={ {
						'onesignal-free-web-push-notifications': {
							name: __( 'Push Notifications' ),
							description: __( 'Connect directly with your users via web push notifications.' ),
						},
					} }
				/>
				{ pushNotificationEnabled && (
					<Fragment>
						<TextControl
							label={ __( 'One Signal App ID' ) }
							value={ appId }
							onChange={ value =>
								onChange( {
									...data,
									app_id: value,
								} )
							}
						/>
						<TextControl
							label={ __( 'One Signal API Key' ) }
							value={ appRestAPIKey }
							onChange={ value =>
								onChange( {
									...data,
									app_rest_api_key: value,
								} )
							}
						/>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

PushNotifications.defaultProps = {
	setPushNotificationEnabled: () => null,
};

export default withWizardScreen( PushNotifications );
