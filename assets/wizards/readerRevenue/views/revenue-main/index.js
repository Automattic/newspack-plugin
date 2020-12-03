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
	PluginInstaller,
	SelectControl,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';
import { NEWSPACK, NRH } from '../../constants';

/**
 * Revenue Main Screen Component
 */
class RevenueMain extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange, onReady, status } = this.props;
		const { newspack: newspackStatus } = status;
		const { nrh_organization_id, nrh_salesforce_campaign_id, platform } = data;
		return (
			<Fragment>
				<SelectControl
					label={ __( 'Select Reader Revenue Platform', 'newspack' ) }
					value={ platform }
					options={ [
						{ label: __( '-- Select Your Platform --', 'newspack' ), value: '' },
						{
							label: __( 'Newspack', 'newspack' ),
							value: NEWSPACK,
						},
						{
							label: __( 'News Revenue Hub', 'newspack' ),
							value: NRH,
						},
					] }
					onChange={ _platform =>
						onChange(
							{
								...data,
								platform: _platform,
							},
							true
						)
					}
				/>
				{ NEWSPACK === platform && ! newspackStatus && (
					<PluginInstaller
						plugins={ [
							'woocommerce',
							'woocommerce-subscriptions',
							'woocommerce-name-your-price',
						] }
						onStatus={ ( { complete } ) => complete && onReady( 'newspack' ) }
					/>
				) }
				{ NEWSPACK === platform && newspackStatus && (
					<Fragment>
						<ActionCard
							title={ __( 'Donations', 'newspack' ) }
							description={ __(
								'Set up a donations page and accept one-time or recurring payments from your readers.'
							) }
							actionText={ __( 'Configure', 'newspack' ) }
							href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/donations"
						/>
						<ActionCard
							title={ __( 'Salesforce', 'newspack' ) }
							description={ __(
								'Integrate Salesforce to capture contact information when readers donate to your organization.',
								'newspack'
							) }
							actionText={ __( 'Configure', 'newspack' ) }
							href="/wp-admin/admin.php?page=newspack-reader-revenue-wizard#/salesforce"
						/>
					</Fragment>
				) }
				{ NRH === platform && (
					<Fragment>
						<TextControl
							label={ __( 'NRH Organization ID', 'newspack' ) }
							value={ nrh_organization_id || '' }
							onChange={ _nrh_organization_id =>
								onChange( { ...data, nrh_organization_id: _nrh_organization_id } )
							}
						/>
						<TextControl
							label={ __( 'NRH Salesforce Campaign ID', 'newspack' ) }
							value={ nrh_salesforce_campaign_id || '' }
							onChange={ _nrh_salesforce_campaign_id =>
								onChange( {
									...data,
									nrh_salesforce_campaign_id: _nrh_salesforce_campaign_id,
								} )
							}
						/>
					</Fragment>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( RevenueMain );
