<?php
/**
 * Reader Activation Wisepops class
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation\Sync\Integrations;

defined( 'ABSPATH' ) || exit;

/**
 * Wisepops Class.
 */
final class Wisepops {
	/**
	 * Wisepops constructor.
	 */
	public static function init() {
		add_action( 'wp_footer', [ __CLASS__, 'add_custom_params' ], 11 );
	}

	/**
	 * Enqueue Wisepops scripts.
	 */
	public static function add_custom_params() {

		$integrations = Integrations::get_active_integrations();

		$keys = [];

		foreach ( $integrations as $integration ) {
			$metadata = $integration->get_metadata_keys();
			foreach ( $metadata as $key ) {
				$keys[] = $key;
			}
		}

		wp_enqueue_script(
			'wisepops_newspack',
			plugins_url( 'wisepops-newspack.js', __FILE__ ),
			[],
			NEWSPACK_VERSION,
			true
		);

		wp_localize_script(
			'wisepops_newspack',
			'wisepops_newspack',
			[
				'keys' => $keys,
			]
		);
	}
}

Wisepops::init();
