<?php
/**
 * Content Gate Countdown Block
 *
 * @package Newspack
 */

defined( 'ABSPATH' ) || exit;

use Newspack;
use Newspack\Memberships;
use Newspack\Memberships\Metering;

/**
 * Content Gate Countdown Block class.
 */
class Content_Gate_Countdown_Block {
	/**
	 * Initialize the block.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
	}

	/**
	 * Enqueue block scripts and styles.
	 *
	 * @return void
	 */
	public static function enqueue_scripts() {
		if ( ! Memberships::is_active() || ! Memberships::has_gate() ) {
			return;
		}
		wp_enqueue_style(
			'newspack-content-gate-countdown-block',
			\Newspack\Newspack::plugin_url() . '/dist/content-gate-countdown-block.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Register the block.
	 */
	public static function register_block() {
		if ( ! Memberships::is_active() || ! Memberships::has_gate() ) {
			return;
		}
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
	 * @param object $block      The block.
	 *
	 * @return string The block HTML.
	 */
	public static function render_block( array $attributes, string $content, $block ) {
		if ( ! Metering::is_metering() ) {
			return '';
		}
		$post_id     = $block->context['postId'] ?? get_the_ID();
		$total_views = Metering::get_total_metered_views( $post_id );
		if ( false === $total_views ) {
			return '';
		}
		$remaining_views = Metering::get_remaining_metered_views( get_current_user_id() );
		$notice          = sprintf(
			/* translators: %s - metered content period (week, month, etc. */
			__(
				'free articles this %s',
				'newspack-plugin'
			),
			Metering::get_metering_period()
		);
		$countdown = sprintf(
			/* translators: 1: remaining metered views, 2: total metered views. */
			__( '%1$d/%2$d', 'newspack-plugin' ),
			$remaining_views,
			$total_views
		);
		$actions = '';
		foreach ( $block->inner_blocks as $inner_block ) {
			$actions .= $inner_block->render();
		}
		$block_wrapper_attributes = get_block_wrapper_attributes(
			[
				'class' => 'newspack-content-gate-countdown',
			]
		);
		$block_content = "<div $block_wrapper_attributes>
			<div class='newspack-content-gate-countdown__content'>
				<div class='newspack-content-gate-countdown__notice'>
					<span class='newspack-content-gate-countdown__countdown'>$countdown</span>
					<p>$notice</p>
				</div>
				<div class='newspack-content-gate-countdown__actions'>
					$actions
				</div>
			</div>
		</div>";

		return $block_content;
	}
}

Content_Gate_Countdown_Block::init();
