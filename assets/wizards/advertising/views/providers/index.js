/**
 * Ad Providers view.
 */

/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginToggle, ActionCard, withWizardScreen } from '../../../../components/src';

/**
 * Advertising management screen.
 */
const Providers = ( { services, toggleService } ) => {
	const { google_ad_manager } = services;

	return (
		<>
			<ActionCard
				title={ __( 'Google Ad Manager' ) }
				description={ __(
					'Manage Google Ad Manager ad units and placements directly from the Newspack dashboard.'
				) }
				actionText={ google_ad_manager && google_ad_manager.enabled && __( 'Configure' ) }
				toggle
				toggleChecked={ google_ad_manager && google_ad_manager.enabled }
				toggleOnChange={ value => toggleService( 'google_ad_manager', value ) }
				titleLink={ google_ad_manager ? '#/google_ad_manager' : null }
				href={ google_ad_manager && '#/google_ad_manager' }
				notification={
					google_ad_manager.status.error
						? [ google_ad_manager.status.error ]
						: google_ad_manager.created_targeting_keys?.length > 0 && [
								__( 'Created custom targeting keys:' ) + '\u00A0',
								google_ad_manager.created_targeting_keys.join( ', ' ) + '. \u00A0',
								// eslint-disable-next-line react/jsx-indent
								<ExternalLink
									href={ `https://admanager.google.com/${ google_ad_manager.network_code }#inventory/custom_targeting/list` }
									key="google-ad-manager-custom-targeting-link"
								>
									{ __( 'Visit your GAM dashboard' ) }
								</ExternalLink>,
						  ]
				}
				notificationLevel={ google_ad_manager.created_targeting_keys?.length ? 'success' : 'error' }
			/>
			<PluginToggle
				plugins={ {
					broadstreet: {
						actionText: __( 'Configure' ),
						href: '/wp-admin/admin.php?page=Broadstreet',
					},
				} }
			/>
		</>
	);
};

export default withWizardScreen( Providers );
