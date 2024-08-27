/* global newspack_analytics_wizard_data */

/**
 * Analytics Plugins View
 */

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
 * Analytics Plugins screen.
 */
class Plugins extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<ActionCard
					title={ __( 'Google Analytics', 'newspack-plugin' ) }
					description={ __( 'Configure and view site analytics', 'newspack-plugin' ) }
					actionText={ __( 'View', 'newspack-plugin' ) }
					handoff="google-site-kit"
					editLink={
						newspack_analytics_wizard_data.analyticsConnectionError
							? undefined
							: 'admin.php?page=googlesitekit-module-analytics'
					}
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( Plugins );
