/* globals newspack_ads_wizard */
/**
 * Ad Add-ons component
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginToggle } from '../../../../components/src';

export default function AddOns() {
	return (
		<PluginToggle
			plugins={ {
				'super-cool-ad-inserter': {
					actionText: __( 'Configure', 'newspack-plugin' ),
					href: '#/settings/scaip',
					shouldRefreshAfterUpdate: true,
					onClick() {
						document.getElementById( 'plugin-settings-scaip' ).scrollIntoView();
					},
				},
				'ad-refresh-control': {
					actionText: __( 'Configure', 'newspack-plugin' ),
					href: '#/settings/ad-refresh-control',
					shouldRefreshAfterUpdate: true,
					onClick() {
						document.getElementById( 'ad-refresh-control' ).scrollIntoView();
					},
				},
				'publisher-media-kit': {
					actionText: __( 'Edit Media Kit', 'newspack-plugin' ),
					href: newspack_ads_wizard.mediakit_edit_url ? newspack_ads_wizard.mediakit_edit_url : '',
					shouldRefreshAfterUpdate: true,
				},
			} }
		/>
	);
}
