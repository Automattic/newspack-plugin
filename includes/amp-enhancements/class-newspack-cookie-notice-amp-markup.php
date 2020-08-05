<?php
/**
 * Overrides Cookie_Notice_AMP_Markup to remove ajax call.
 *
 * @package Newspack
 */

namespace Newspack;

use Felix_Arntz\WP_GDPR_Cookie_Notice\Cookie_Notice\Cookie_Notice_AMP_Markup;

defined( 'ABSPATH' ) || exit;

/**
 * Modifies the <amp-consent> config for better performance on high-traffic sites.
 */
class Newspack_Cookie_Notice_AMP_Markup extends Cookie_Notice_AMP_Markup {

	/**
	 * Modifies the <amp-consent> config to eliminate the ajax call sent on every request.
	 * The notice will then always show to people that haven't accepted it yet.
	 *
	 * @return array Data to pass to the `<amp-consent>` element.
	 */
	protected function get_consent_data() {
		return [
			'consentInstanceId' => self::AMP_INSTANCE,
			'consentRequired'   => true,
			'promptUI'          => 'wp-gdpr-cookie-notice',

		];
	}
}
