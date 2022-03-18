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
					actionText: __( 'Configure' ),
					href: '#/settings',
				},
				'ad-refresh-control': {
					actionText: __( 'Configure' ),
					href: '#/settings',
				},
			} }
		/>
	);
}
