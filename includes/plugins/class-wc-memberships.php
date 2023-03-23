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
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
		add_action( 'admin_init', [ __CLASS__, 'redirect_cpt' ] );
		add_action( 'admin_init', [ __CLASS__, 'handle_edit_gate' ] );
		add_action( 'admin_head', [ __CLASS__, 'editor_css' ] );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );
		add_filter( 'wc_memberships_notice_html', [ __CLASS__, 'notice_html' ], 100 );
		add_filter( 'wc_memberships_restricted_content_excerpt', [ __CLASS__, 'excerpt' ], 100, 3 );
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
					'new_item'               => __( 'New Memberships Gate', 'newspack' ),
					'edit_item'              => __( 'Edit Memberships Gate', 'newspack' ),
					'view_item'              => __( 'View Memberships Gate', 'newspack' ),
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
	 * Register gate meta.
	 */
	public static function register_meta() {
		\register_meta(
			'post',
			'style',
			[
				'object_subtype' => self::GATE_CPT,
				'show_in_rest'   => true,
				'type'           => 'string',
				'default'        => 'inline',
				'single'         => true,
			]
		);
		\register_meta(
			'post',
			'inline_fade',
			[
				'object_subtype' => self::GATE_CPT,
				'show_in_rest'   => true,
				'type'           => 'boolean',
				'default'        => true,
				'single'         => true,
			]
		);
		\register_meta(
			'post',
			'use_more_tag',
			[
				'object_subtype' => self::GATE_CPT,
				'show_in_rest'   => true,
				'type'           => 'boolean',
				'default'        => true,
				'single'         => true,
			]
		);
		\register_meta(
			'post',
			'visible_paragraphs',
			[
				'object_subtype' => self::GATE_CPT,
				'show_in_rest'   => true,
				'type'           => 'integer',
				'default'        => 2,
				'single'         => true,
			]
		);
	}

	/**
	 * Redirect the custom gate CPT to the Memberships wizard
	 */
	public static function redirect_cpt() {
		global $pagenow;
		if ( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && self::GATE_CPT === $_GET['post_type'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			\wp_safe_redirect( \admin_url( 'admin.php?page=newspack-engagement-wizard' ) );
			exit;
		}
	}

	/**
	 * Custom CSS for the gate editor.
	 */
	public static function editor_css() {
		if ( self::GATE_CPT !== get_post_type() ) {
			return;
		}
		?>
		<style>
			.edit-post-post-visibility {
				display: none;
			}
		</style>
		<?php
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		if ( self::GATE_CPT !== get_post_type() ) {
			return;
		}
		\wp_enqueue_script(
			'newspack-memberships-gate',
			Newspack::plugin_url() . '/dist/memberships-gate-editor.js',
			[],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/memberships-gate-editor.js' ),
			true
		);
		\wp_enqueue_style(
			'newspack-memberships-gate',
			Newspack::plugin_url() . '/dist/memberships-gate-editor.css',
			[],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/memberships-gate-editor.css' )
		);
	}

	/**
	 * Set the post ID of the custom gate.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function set_gate_post_id( $post_id ) {
		\update_option( 'newspack_memberships_gate_post_id', $post_id );
	}

	/**
	 * Get the post ID of the custom gate.
	 *
	 * @return int|false Post ID or false if not set.
	 */
	public static function get_gate_post_id() {
		$post_id = (int) \get_option( 'newspack_memberships_gate_post_id' );
		return $post_id ? $post_id : false;
	}

	/**
	 * Whether the gate is available.
	 *
	 * @return bool
	 */
	public static function has_gate() {
		$post_id = self::get_gate_post_id();
		return $post_id && 'publish' === get_post_status( $post_id );
	}

	/**
	 * Get the URL for editing the custom gate.
	 */
	public static function get_edit_gate_url() {
		$action = 'newspack_edit_memberships_gate';
		$url    = \add_query_arg( '_wpnonce', \wp_create_nonce( $action ), \admin_url( 'admin.php?action=' . $action ) );
		return str_replace( \site_url(), '', $url );
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
			// Untrash post if it's in the trash.
			if ( 'trash' === get_post_status( $gate_post_id ) ) {
				\wp_untrash_post( $gate_post_id );
			}
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
		// If the gate is not available, don't mess with the notice.
		if ( ! self::has_gate() ) {
			return $notice;
		}
		// If rendering the content in a loop, don't render the gate.
		if ( get_queried_object_id() !== get_the_ID() ) {
			return '';
		}
		$gate_post_id = self::get_gate_post_id();
		$style        = \get_post_meta( $gate_post_id, 'style', true );
		if ( 'inline' === $style ) {
			$notice = \apply_filters( 'the_content', \get_the_content( null, null, $gate_post_id ) );
		} else {
			$notice = '';
		}
		return $notice;
	}

	/**
	 * Filter the excerpt.
	 *
	 * @param string $excerpt      Excerpt.
	 * @param object $post         Post object.
	 * @param string $message_code Message code.
	 *
	 * @return string
	 */
	public static function excerpt( $excerpt, $post, $message_code ) {
		// If the gate is not available, don't mess with the excerpt.
		if ( ! self::has_gate() ) {
			return $excerpt;
		}
		// If rendering the content in a loop, don't truncate the excerpt.
		if ( get_queried_object_id() !== $post->ID ) {
			return $excerpt;
		}
		$gate_post_id = self::get_gate_post_id();

		$content = $post->post_content;

		$use_more_tag = get_post_meta( $gate_post_id, 'use_more_tag', true );
		// Use <!--more--> as threshold if it exists.
		if ( $use_more_tag && strpos( $content, '<!--more-->' ) ) {
			$content = explode( '<!--more-->', $content )[0];
		} else {
			$count = (int) get_post_meta( $gate_post_id, 'visible_paragraphs', true );
			// Split into paragraphs.
			$content = explode( '</p>', $content );
			// Extract the first $x paragraphs only.
			$content = array_slice( $content, 0, $count ?? 2 );
			// Rejoin the paragraphs into a single string again.
			$content = wp_kses_post( implode( '</p>', $content ) );
		}
		$inline_fade_content = '<div style="pointer-events: none; height: 10em; margin-top: -10em; width: 100%; position: absolute; background: linear-gradient(180deg, rgba(255,255,255,0) 14%, rgba(255,255,255,1) 76%);"></div>';

		$excerpt = $content;

		$style       = \get_post_meta( $gate_post_id, 'style', true );
		$inline_fade = \get_post_meta( $gate_post_id, 'inline_fade', true );
		if ( 'inline' === $style && $inline_fade ) {
			$excerpt .= $inline_fade_content;
		}

		return $excerpt;
	}
}
WC_Memberships::init();
