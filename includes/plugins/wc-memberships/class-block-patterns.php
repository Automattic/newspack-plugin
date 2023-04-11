<?php
/**
 * WooCommerce Memberships Block Patterns.
 *
 * @package Newspack
 */

namespace Newspack\WC_Memberships;

/**
 * WooCommerce Memberships Block Patterns class.
 */
class Block_Patterns {
	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block_patterns' ] );
	}

	/**
	 * Get block patterns.
	 */
	public static function get_patterns() {
		$patterns = [
			'registration-wall' => [
				'title'       => __( 'Registration Wall', 'newspack' ),
				'description' => _x( 'Invite your reader to register before continuing reading the article', 'Block pattern description', 'newspack' ),
			],
		];
		return $patterns;
	}

	/**
	 * Register block patterns.
	 */
	public static function register_block_patterns() {
		// Bail if Woo Memberships is not active.
		if ( ! class_exists( 'WC_Memberships' ) ) {
			return false;
		}
		\register_block_pattern_category( 'newspack-memberships', [ 'label' => __( 'Memberships', 'newspack' ) ] );
		$patterns = self::get_patterns();
		foreach ( $patterns as $pattern => $args ) {
			$content_path = __DIR__ . '/patterns/' . $pattern . '.php';
			if ( ! file_exists( $content_path ) ) {
				continue;
			}
			ob_start();
			require $content_path;
			$content = ob_get_clean();
			if ( empty( $content ) ) {
				continue;
			}
			\register_block_pattern(
				'newspack-memberships/' . $pattern,
				[
					'categories'  => [ 'newspack-memberships' ],
					'title'       => $args['title'],
					'description' => $args['description'],
					'content'     => $content,
				]
			);
		}
	}
}
Block_Patterns::init();
