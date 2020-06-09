/**
 * Revenue Main Screen
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, PluginToggle, withWizardScreen } from '../../../../components/src';

/**
 * Revenue Main Screen Component
 */
class RevenueMain extends Component {
	/**
	 * Render.
	 */
	render() {
		return (
			<Fragment>
				<ActionCard
					title={ __( 'Donations' ) }
					description={ __(
						'Set up a donations page and accept one-time or recurring payments from your readers.'
					) }
					actionText={ __( 'Configure' ) }
					href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/donations"
				/>
				<ActionCard
					title={ __( 'Salesforce' ) }
					description={ __(
						'Integrate Salesforce to capture leads when readers donate to your organization.'
					) }
					actionText={ __( 'Configure' ) }
					href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/salesforce"
				/>
				<PluginToggle
					plugins={ {
						laterpay: true,
					} }
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( RevenueMain );
