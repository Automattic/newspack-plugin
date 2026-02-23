<?php
/**
 * Content Gate IP Check Block
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Content_Gate\IP_Check;

defined( 'ABSPATH' ) || exit;

/**
 * Content Gate IP Check Block class.
 */
class Content_Gate_IP_Check_Block {
	/**
	 * Initialize the block.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
	}

	/**
	 * Register the block.
	 */
	public static function register_block() {
		register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
			]
		);
	}

	/**
	 * Block render callback.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content    The block content.
	 *
	 * @return string The block HTML.
	 */
	public static function render_block( array $attributes, string $content ) {
		$success_url = ! empty( $attributes['successUrl'] ) ? esc_url( $attributes['successUrl'] ) : '';
		$failure_url = ! empty( $attributes['failureUrl'] ) ? esc_url( $attributes['failureUrl'] ) : '';

		$block_wrapper_attributes = get_block_wrapper_attributes(
			[
				'class'            => 'newspack-content-gate-ip-check-block',
				'data-success-url' => $success_url,
				'data-failure-url' => $failure_url,
			]
		);

		$inner_html = IP_Check::render_ip_check_content();

		return "<div $block_wrapper_attributes><div class=\"newspack-ui\">$inner_html</div></div>";
	}

	/**
	 * Enqueue block scripts on the frontend.
	 */
	public static function enqueue_scripts() {
		if ( ! is_singular() ) {
			return;
		}
		wp_enqueue_script(
			'newspack-content-gate-ip-check-block',
			Newspack::plugin_url() . '/dist/content-gate-ip-check-block.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'newspack-content-gate-ip-check-block',
			'newspack_ip_check_block',
			[
				'cookie_name' => IP_Check::COOKIE_NAME,
				'ajax_url'    => admin_url( 'admin-ajax.php' ),
			]
		);
	}
}

Content_Gate_IP_Check_Block::init();
