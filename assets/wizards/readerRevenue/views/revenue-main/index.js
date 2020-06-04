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
import {
	ActionCard,
	Button,
	Card,
	PluginToggle,
	TextControl,
	withWizardScreen
} from '../../../../components/src';

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
				<Card key="revenue-main">
					<ActionCard
						title={ __( 'Donations' ) }
						description={ __(
							'Set up a donations page and accept one-time or recurring payments from your readers.'
						) }
						actionText={ __( 'Configure' ) }
						href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/donations"
					/>
					<PluginToggle
						plugins={ {
							laterpay: true,
						} }
					/>
				</Card>
				<Card key="salesforce">
					<p>{ __( 'Integrate the Donation feature with SalesForce. To connect with SalesForce, enter your Consumer Key and Secret below, then click the "Connect" button to authorize access to your SalesForce Org.' ) }</p>

					<p>{ __(' To find your Consumer Key and Secret, log into your SalesForce Org and and go to Settings > Apps > App Manager, then find or create the Connected App for this site. The Consumer Key and Secret are displayed under the "API (Enable OAuth Settings)" section.' ) }</p>

					<TextControl
						label={ __( 'Enter your SalesForce Consumer Key' ) }
						value={ '' }
					/>
					<TextControl
						label={ __( 'Enter your SalesForce Consumer Secret' ) }
						value={ '' }
					/>
					<div className="newspack-buttons-card">
						<Button
							isPrimary
							onClick={ e => console.log( e ) }
						>
							{ __( 'Connect' ) }
						</Button>
					</div>
				</Card>
			</Fragment>
		);
	}
}

export default withWizardScreen( RevenueMain );
