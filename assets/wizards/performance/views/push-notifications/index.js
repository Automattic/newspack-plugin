/**
 * Performance Wizard Push Notifications screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';

/**
 * Description and controls for the Push Notification feature.
 */
class PushNotifications extends Component {
	/**
	 * Render.
	 */
	render() {
		const { pluginRequirements } = this.props;
		return (
			<Fragment>
				<p>
					{ __(
						'You just published new content and you want to let everyone know? Why not send a push notification? We has an integrated connection to Firebase that lets you manage registered devices and send push notifications to all or selected devices!'
					) }
				</p>
			</Fragment>
		);
	}
}

export default withWizardScreen( PushNotifications, {} );
