/**
 * Ad Refresh Control plugin settings component.
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginSettings } from '../../../../components/src';

const fields = [
	{
		key: 'viewability_threshold',
		type: 'int',
		description: __( 'Viewability Threshold', 'newspack' ),
		help: __(
			"The percentage of the ad slot which must be visible in the viewport in order to be considered eligible for being refreshed. It's recommended you do not lower this below 50 or you risk third-party viewability tracking platforms flagging your ad impressions as not having been viewed before refreshing.",
			'newspack'
		),
		value: 70,
	},
	{
		key: 'refresh_interval',
		type: 'int',
		description: __( 'Refresh Interval', 'newspack' ),
		help: __(
			'The number of seconds that must pass between an ad crossing the viewability threshold and the the ad refreshing. The plugin enforces a minimum of 30 in order to avoid your site being flagged for abusing ad refreshes by advertisers. This value may however be overridden via the avc_refresh_interval_value filter hook.',
			'newspack'
		),
		value: 30,
	},
	{
		key: 'maximum_refreshes',
		type: 'int',
		description: __( 'Maximum Refreshes', 'newspack' ),
		help: __(
			'The number of times each ad slot is allowed to be refreshed. If this is set to 4 then an ad slot could have a total of 5 impressions by combining the initial loading of the ad with the 4 times it can refresh.',
			'newspack'
		),
		value: 10,
	},
	{
		key: 'adverstiser_ids',
		type: 'string',
		description: __( 'Excluded Advertiser IDs', 'newspack' ),
		help: __(
			'Prevent ad refreshes for specific advertiser IDs in the format of a comma separated list (e.g., 125,594,293). If an ad slot ever displays an ad creative from one of the listed advertiser IDs then that ad slot will stop refreshing for the remainder of the page view.',
			'newspack'
		),
	},
	{
		key: 'line_items_ids',
		type: 'string',
		description: __( 'Line Items IDs to Exclude', 'newspack' ),
		help: __(
			'Prevent ad refreshs for specific line item IDs. (Comma Seperated List)',
			'newspack'
		),
	},
	{
		key: 'sizes_to_exclude',
		type: 'string',
		description: __( 'Sizes to Exclude', 'newspack' ),
		help: __(
			'Prevent ad refreshs for specific sizes. Accepts string (fluid) or array (300x250). Example: fluid, 300x250.',
			'newspack'
		),
	},
	{
		key: 'slot_ids_to_exclude',
		type: 'string',
		description: __( 'Slot IDs to Exclude', 'newspack' ),
		help: __(
			'Prevent ad refreshs for specific slot IDs e.g. div-gpt-ad-grid-1. (Comma Seperated List).',
			'newspack'
		),
	},
];

export default function AdRefreshControlSettings() {
	const [ inFlight, setInFlight ] = useState( false );
	useEffect( async () => {
		setInFlight( true );
	}, [] );
	return (
		<PluginSettings.Section
			disabled={ inFlight }
			sectionKey="ad-refresh-control"
			title={ __( 'Ad Refresh Control', 'newspack' ) }
			description={ __(
				'Enable Active View refresh for Google Ad Manager ads without needing to modify any code.',
				'newspack'
			) }
			active={ true }
			fields={ fields }
			onUpdate={ data => {
				console.log( 'Plugin Settings Section Updated', data );
			} }
			onChange={ ( key, val ) => {
				console.log( 'Plugin Settings Section Changed', { key, val } );
			} }
		/>
	);
}
