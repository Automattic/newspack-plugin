/* global newspack_analytics_wizard_data */

/**
 * Analytics Plugins View
 */

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard } from '../../../../../../components/src';

/**
 * Analytics Plugins screen.
 */
const Analytics = ( { editLink }: { editLink: string } ) => {
	/**
	 * Render.
	 */
	return (
		<Fragment>
			<ActionCard
				title={ __( 'Google Analytics', 'newspack-plugin' ) }
				description={ __( 'Configure and view site analytics', 'newspack-plugin' ) }
				actionText={ __( 'View', 'newspack-plugin' ) }
				handoff="google-site-kit"
				editLink={ editLink }
			/>
		</Fragment>
	);
};

export default Analytics;
