<?php
/**
 * My Account Button Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\My_Account_Button;

use Newspack\Reader_Activation;
use Newspack\Newspack_UI_Icons;
use Newspack\Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * My Account Button Block.
 */
final class My_Account_Button_Block {
	/**
	 * Initialize the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register block from metadata.
	 *
	 * @return void
	 */
	public static function register_block() {
		\register_block_type_from_metadata(
			__DIR__ . '/block.json',
			array(
				'render_callback' => [ __CLASS__, 'render_block' ],
			)
		);
	}

	/**
	 * Get the account URL for the current site.
	 *
	 * @return string
	 */
	private static function get_account_url() {
		if ( function_exists( 'wc_get_account_endpoint_url' ) ) {
			return \wc_get_account_endpoint_url( 'dashboard' );
		}

		if ( function_exists( 'wc_get_page_permalink' ) ) {
			$account_url = \wc_get_page_permalink( 'myaccount' );
			if ( $account_url ) {
				return $account_url;
			}
		}

		$account_page_id = \get_option( 'woocommerce_myaccount_page_id' );
		if ( $account_page_id ) {
			$account_url = \get_permalink( $account_page_id );
			if ( $account_url ) {
				return $account_url;
			}
		}

		return '';
	}

	/**
	 * Render My Account Button Block.
	 *
	 * @param array $attrs Block attributes.
	 *
	 * @return string
	 */
	public static function render_block( $attrs ) {
		if ( ! Reader_Activation::is_enabled() ) {
			return '';
		}

		wp_enqueue_style(
			'newspack-blocks-frontend',
			Newspack::plugin_url() . '/dist/blocks.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);

		$default_attrs = [
			'signedInLabel'  => __( 'My Account', 'newspack-plugin' ),
			'signedOutLabel' => __( 'Sign in', 'newspack-plugin' ),
		];
		$attrs         = \wp_parse_args( $attrs, $default_attrs );

		$label = \is_user_logged_in() ? $attrs['signedInLabel'] : $attrs['signedOutLabel'];
		if ( '' === trim( (string) $label ) ) {
			return '';
		}

		$account_url = self::get_account_url();

		/** Do not render link for authenticated readers if account page doesn't exist. */
		if ( empty( $account_url ) && \is_user_logged_in() ) {
			return '';
		}

		$href = \is_user_logged_in() ? $account_url : '#';

		$labels = [
			'signedin'  => $attrs['signedInLabel'],
			'signedout' => $attrs['signedOutLabel'],
		];

		$wrapper_attributes = \get_block_wrapper_attributes(
			[
				'class' => 'wp-block-button__link newspack-reader__account-link wp-block-newspack-my-account-button__link',
				'href'  => \esc_url_raw( $href ),
			]
		);

		$link  = '<a ' . $wrapper_attributes . ' data-labels="' . \esc_attr( htmlspecialchars( \wp_json_encode( $labels ), ENT_QUOTES, 'UTF-8' ) ) . '" data-newspack-reader-account-link>';
		$link .= '<span class="newspack-reader__account-link__icon">';
		$link .= Newspack_UI_Icons::get_svg( 'account' );
		$link .= '</span>';
		$link .= '<span class="newspack-reader__account-link__label">' . \esc_html( $label ) . '</span>';
		$link .= '</a>';

		/**
		 * Filters the HTML for the My Account button block.
		 *
		 * @param string $link HTML for the button.
		 * @param array  $attrs Block attributes.
		 */
		return apply_filters( 'newspack_my_account_button_html', $link, $attrs );
	}
}

My_Account_Button_Block::init();
