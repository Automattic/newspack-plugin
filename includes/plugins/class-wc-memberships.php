<?php
/**
 * WooCommerce Memberships integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class WC_Memberships {

	const GATE_CPT = 'np_memberships_gate';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'admin_init', [ __CLASS__, 'redirect_cpt' ] );
		add_action( 'admin_init', [ __CLASS__, 'handle_edit_gate' ] );
		add_filter( 'wc_memberships_notice_html', [ __CLASS__, 'notice_html' ], 100 );
	}

	/**
	 * Set the post ID of the custom gate.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function set_gate_post_id( $post_id ) {
		\update_option( 'newspack_memberships_gate', $post_id );
	}

	/**
	 * Redirect the custom gate CPT to the Memberships wizard
	 */
	public static function redirect_cpt() {
		global $pagenow;
		if ( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && self::GATE_CPT === $_GET['post_type'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			\wp_safe_redirect( \admin_url( 'admin.php?page=newspack-engagement-wizard#/memberships' ) );
			exit;
		}
	}

	/**
	 * Get the post ID of the custom gate.
	 *
	 * @return int|false Post ID or false if not set.
	 */
	public static function get_gate_post_id() {
		$post_id = (int) \get_option( 'newspack_memberships_gate' );
		return $post_id ? $post_id : false;
	}

	/**
	 * Register post type for custom gate.
	 */
	public static function register_post_type() {
		\register_post_type(
			self::GATE_CPT,
			[
				'label'        => __( 'Memberships Gate', 'newspack' ),
				'labels'       => [
					'item_published'         => __( 'Memberships Gate published.', 'newspack' ),
					'item_reverted_to_draft' => __( 'Memberships Gate reverted to draft.', 'newspack' ),
					'item_updated'           => __( 'Memberships Gate updated.', 'newspack' ),
				],
				'public'       => false,
				'show_ui'      => true,
				'show_in_menu' => false,
				'show_in_rest' => true,
				'supports'     => [ 'editor', 'custom-fields' ],
			]
		);
	}

	/**
	 * Get the URL for editing the custom gate.
	 */
	public static function get_edit_gate_url() {
		$action = 'newspack_edit_memberships_gate';
		$url    = \admin_url( 'admin.php?action=' . $action );
		return add_query_arg( '_wpnonce', wp_create_nonce( $action ), $url );
	}

	/**
	 * Create a post for the custom gate.
	 */
	public static function handle_edit_gate() {
		if ( ! isset( $_GET['action'] ) || 'newspack_edit_memberships_gate' !== $_GET['action'] ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		check_admin_referer( 'newspack_edit_memberships_gate' );
		$gate_post_id = self::get_gate_post_id();
		if ( $gate_post_id && get_post( $gate_post_id ) ) {
			// Gate found, edit it.
			\wp_safe_redirect( \admin_url( 'post.php?post=' . $gate_post_id . '&action=edit' ) );
			exit;
		} else {
			// Gate not found, create it.
			$gate_post_id = \wp_insert_post(
				[
					'post_title'   => __( 'Memberships Gate', 'newspack' ),
					'post_type'    => self::GATE_CPT,
					'post_status'  => 'draft',
					'post_content' => '<!-- wp:paragraph --><p>' . __( 'This post is only available to members.', 'newspack' ) . '</p><!-- /wp:paragraph -->',
				]
			);
			if ( is_wp_error( $gate_post_id ) ) {
				\wp_die( esc_html( $gate_post_id->get_error_message() ) );
			}
			self::set_gate_post_id( $gate_post_id );
			\wp_safe_redirect( \admin_url( 'post.php?post=' . $gate_post_id . '&action=edit' ) );
			exit;
		}
	}

	/**
	 * Filter the notice HTML.
	 *
	 * @param string $notice Notice HTML.
	 */
	public static function notice_html( $notice ) {
		$gate_post_id = self::get_gate_post_id();
		if ( $gate_post_id && get_post( $gate_post_id ) && 'publish' === get_post_status( $gate_post_id ) ) {
			$notice = \get_the_content( null, false, $gate_post_id );
		}
		return $notice;
	}
}
WC_Memberships::init();
