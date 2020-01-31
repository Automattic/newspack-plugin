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
				<p>{ __( 'Newspack can help you set up a donations page and accept one-time or recurring payments from your readers.' ) }</p>
				<ActionCard
					title={ __( 'Donations' ) }
					description={ __( 'Suggest donations on your website.' ) }
					actionText={ __( 'Configure' ) }
					href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/donations"
				/>
				<ActionCard
					title={ __( 'Memberships' ) }
					description={ __( 'Add a memberships page to your website.' ) }
					actionText={ __( 'Configure' ) }
					href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/configure-landing-page"
				/>
				<PluginToggle
					plugins={ {
						laterpay: true
					} }
				/>
			</Fragment>
		);
	}
}

export default withWizardScreen( RevenueMain );
