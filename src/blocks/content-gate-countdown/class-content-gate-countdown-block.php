<?php
/**
 * Content Gate Countdown Block
 *
 * @package Newspack
 */

defined( 'ABSPATH' ) || exit;

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
	}

	/**
	 * Register the block.
	 */
	public static function register_block() {
		// Only register if Memberships is active.
		if ( ! Memberships::is_active() ) {
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
		$text    = isset( $attributes['text'] ) ? $attributes['text'] : __( 'Get unlimited access.', 'newspack-plugin' );
		$buttons = '';
		foreach ( $block->inner_blocks as $inner_block ) {
			$buttons .= $inner_block->render();
		}
		$block_wrapper_attributes = get_block_wrapper_attributes(
			[
				'class' => 'newspack-content-gate-countdown',
			]
		);
		$block_content = "<div $block_wrapper_attributes>
			<div class='newspack-content-gate-countdown__content'>
				<div class='newspack-content-gate-countdown__notice'>
					<span class='newspack-content-gate-countdown__views'>$remaining_views / $total_views</span>
					<p>$notice</p>
				</div>
				<div class='newspack-content-gate-countdown__actions'>
					<p>$text</p>
					$buttons
				</div>
			</div>
		</div>";

		return $block_content;
	}
}

Content_Gate_Countdown_Block::init();
