<?php
/**
 * Wizard redirects for legacy wizards.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Redirects;

/**
 * Redirects.
 */
class Redirects {
	const REDIRECTS_MAPPING = [
		'newspack'                       => 'newspack-dashboard',
		'newspack-site-design-wizard'    => 'newspack-settings#/theme-and-brand',
		'newspack-reader-revenue-wizard' => 'newspack-audience#/payment',
		'newspack-advertising-wizard'    => 'newspack-settings#/advertising',
		'newspack-analytics-wizard'      => 'newspack-settings#/analytics',
		'newspack-connections-wizard'    => 'newspack-settings#/connections',
		'newspack-engagement-wizard'     => 'newspack-audience',
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
		// 'newspack-health-check-wizard'   => 'newspack-settings#/health-check', // TODO: Check if this is correct.
		'newspack-popups-wizard'         => 'newspack-audience-campaigns#/campaigns',
		'newspack-seo-wizard'            => 'newspack-settings#/seo',
		'newspack-settings-wizard'       => 'newspack-settings#/syndication',
		'newspack-syndication-wizard'    => 'newspack-settings#/syndication',
	];
}
