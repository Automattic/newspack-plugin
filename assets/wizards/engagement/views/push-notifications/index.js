/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';

/**
 * Push Notifications screen.
 */
class PushNotifications extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pushNotificationsEnabled, setPushNotificationEnabled } = this.props;
		return (
			<ActionCard
				title={ __( 'Enable Push Notifications' ) }
				description={ __( 'Connect directly with your users via web push notifications.' ) }
				toggle
				toggleChecked={ pushNotificationsEnabled }
				toggleOnChange={ value => setPushNotificationEnabled( value ) }
			/>
		);
	}
}

PushNotifications.defaultProps = {
	setPushNotificationEnabled: () => null,
};

export default withWizardScreen( PushNotifications );
