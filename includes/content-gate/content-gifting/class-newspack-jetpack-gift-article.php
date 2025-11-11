<?php
/**
 * Newspack Jetpack Gift Article class.
 *
 * @package Newspack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Sharing_Source' ) ) {
	return;
}

/**
 * Newspack Jetpack Gift Article class.
 */
class Newspack_Jetpack_Gift_Article extends Sharing_Source {
	/**
	 * Service short name.
	 *
	 * @var string
	 */
	public $shortname = 'newspack-gift-article';

	/**
	 * Should the sharing link open in a new tab.
	 *
	 * @var bool
	 */
	public $open_link_in_new = false;

	/**
	 * Service name.
	 *
	 * @return string
	 */
	public function get_name() {
		return __( 'Gift this article', 'newspack-plugin' );
	}


	/**
	 * Get the markup of the sharing button.
	 *
	 * @param WP_Post $post The post object.
	 *
	 * @return string
	 */
	public function get_display( $post ) {
		if ( ! Newspack\Content_Gifting::can_gift_post( $post->ID ) ) {
			return '';
		}
		return $this->get_link(
			Newspack\Content_Gifting::get_gift_url( $post->ID ),
			_x( 'Gift this article', 'Jetpack sharing source', 'newspack-plugin' ),
			__( 'Click to gift this article', 'newspack-plugin' ),
			'share=newspack-gift-article',
			'newspack-gift-article-' . $post->ID
		);
	}
}
