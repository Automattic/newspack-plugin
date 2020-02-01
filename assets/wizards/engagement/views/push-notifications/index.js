/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, TextControl, withWizardScreen } from '../../../../components/src';

/**
 * Push Notifications screen.
 */
class PushNotifications extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const {
			push_notification_enabled: pushNotificationEnabled,
			one_signal_api_key: oneSignalAPIKey,
		} = data;
		return (
			<Fragment>
				<ActionCard
					title={ __( 'Enable Push Notifications' ) }
					description={ __( 'Connect directly with your users via web push notifications.' ) }
					toggle
					toggleChecked={ pushNotificationEnabled }
					toggleOnChange={ value =>
						onChange(
							{
								...data,
								[ 'push_notification_enabled' ]: value,
							},
							true
						)
					}
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
