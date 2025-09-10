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

		$remaining_views = Metering::get_remaining_metered_views( get_current_user_id() );
		$text            = isset( $attributes['text'] ) ? $attributes['text'] : '';
		if ( empty( $text ) ) {
			$text = $remaining_views > 0 ?
			sprintf(
				/* translators: %d - number of remaining views. */
				_n(
					'You have %s free article left.',
					'You have %s free articles left.',
					$remaining_views,
					'newspack-plugin'
				),
				$remaining_views
			) :
			__( 'You have no free articles left.', 'newspack-plugin' );
		}

		$block_wrapper_attributes = get_block_wrapper_attributes(
			[
				'class' => 'newspack-content-gate-countdown',
			]
		);

		$block_content = "<div $block_wrapper_attributes>
			<div class='newspack-content-gate-countdown__content'>
				<p>$text</p>
			</div>
		</div>";

		return $block_content;
	}
}

Content_Gate_Countdown_Block::init();
