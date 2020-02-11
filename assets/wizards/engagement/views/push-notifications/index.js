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
		const { data, onChange } = this.props;
		const { one_signal_api_key: oneSignalAPIKey } = data;
		return (
			<Fragment>
				<PluginToggle
					onReady={ pluginInfo => {
						const { 'onesignal-free-web-push-notifications': oneSignal } = pluginInfo;
						const { Status: status } = oneSignal || {};
						this.setState( {
							pushNotificationEnabled: 'active' === status,
						} );
					} }
					plugins={ {
						'onesignal-free-web-push-notifications': {
							name: __( 'Push Notifications' ),
							description: __( 'Connect directly with your users via web push notifications.' ),
						},
					} }
				/>
				{ pushNotificationEnabled && (
					<TextControl
						label={ __( 'One Signal API Key' ) }
						value={ oneSignalAPIKey }
						onChange={ value =>
							onChange( {
								...data,
								[ 'one_signal_api_key' ]: value,
							} )
						}
					/>
				) }
			</Fragment>
		);
	}
}

PushNotifications.defaultProps = {
	setPushNotificationEnabled: () => null,
};

export default withWizardScreen( PushNotifications );
