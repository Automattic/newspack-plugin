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

	const METERING_META_KEY = 'np_memberships_metering';

	/**
	 * Whether the gate has been rendered in this execution.
	 *
	 * @var boolean
	 */
	private static $gate_rendered = false;

	/**
	 * Cache of the user's metering status for posts.
	 *
	 * @var boolean[] Map of post IDs to booleans.
	 */
	private static $logged_in_metering_cache = [];

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
		add_action( 'admin_init', [ __CLASS__, 'redirect_cpt' ] );
		add_action( 'admin_init', [ __CLASS__, 'handle_edit_gate' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );
		add_action( 'wp', [ __CLASS__, 'handle_metering_restriction' ], 11 );
		add_filter( 'wc_memberships_notice_html', [ __CLASS__, 'notice_html' ], 100, 4 );
		add_filter( 'wc_memberships_restricted_content_excerpt', [ __CLASS__, 'excerpt' ], 100, 3 );
		add_filter( 'wc_memberships_message_excerpt_apply_the_content_filter', '__return_false' );
		add_action( 'wp_footer', [ __CLASS__, 'render_overlay_gate' ], 1 );
		add_action( 'wp_footer', [ __CLASS__, 'render_js' ] );
		add_filter( 'newspack_popups_assess_has_disabled_popups', [ __CLASS__, 'disable_popups' ] );

		include __DIR__ . '/class-block-patterns.php';
	}

	/**
	 * Register post type for custom gate.
	 */
	public static function register_post_type() {
		// Bail if Woo Memberships is not active.
		if ( ! class_exists( 'WC_Memberships' ) ) {
			return false;
		}
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
		// Bail if Woo Memberships is not active.
		if ( ! class_exists( 'WC_Memberships' ) ) {
			return false;
		}
		$meta = [
			'style'                     => [
				'type'    => 'string',
				'default' => 'inline',
			],
			'inline_fade'               => [
				'type'    => 'boolean',
				'default' => true,
			],
			'use_more_tag'              => [
				'type'    => 'boolean',
				'default' => true,
			],
			'visible_paragraphs'        => [
				'type'    => 'integer',
				'default' => 2,
			],
			'overlay_position'          => [
				'type'    => 'string',
				'default' => 'center',
			],
			'overlay_size'              => [
				'type'    => 'string',
				'default' => 'medium',
			],
			'metering'                  => [
				'type'    => 'boolean',
				'default' => false,
			],
			'metering_anonymous_count'  => [
				'type'    => 'integer',
				'default' => 0,
			],
			'metering_registered_count' => [
				'type'    => 'integer',
				'default' => 3,
			],
			'metering_period'           => [
				'type'    => 'string',
				'default' => 'week',
			],
		];
		foreach ( $meta as $key => $config ) {
			\register_meta(
				'post',
				$key,
				[
					'object_subtype' => self::GATE_CPT,
					'show_in_rest'   => true,
					'type'           => $config['type'],
					'default'        => $config['default'],
					'single'         => true,
				]
			);
		}
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
	 * Enqueue frontend scripts and styles for gated content.
	 */
	public static function enqueue_scripts() {
		if ( ! self::has_gate() ) {
			return;
		}
		if ( ! is_singular() || ! self::is_post_restricted() ) {
			return;
		}
		$gate_post_id = self::get_gate_post_id();
		$style        = \get_post_meta( $gate_post_id, 'style', true );
		if ( 'overlay' === $style ) {
			$overlay_handle = 'newspack-memberships-gate-overlay';
			\wp_enqueue_script(
				$overlay_handle,
				Newspack::plugin_url() . '/dist/memberships-gate-overlay.js',
				[],
				filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/memberships-gate-overlay.js' ),
				true
			);
			\wp_script_add_data( $overlay_handle, 'async', true );
			\wp_enqueue_style(
				$overlay_handle,
				Newspack::plugin_url() . '/dist/memberships-gate-overlay.css',
				[],
				filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/memberships-gate-overlay.css' )
			);
		}
		if ( self::is_frontend_metering() ) {
			$metering_handle = 'newspack-memberships-gate-metering';
			\wp_enqueue_script(
				$metering_handle,
				Newspack::plugin_url() . '/dist/memberships-gate-metering.js',
				[],
				filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/memberships-gate-metering.js' ),
				true
			);
			\wp_localize_script(
				$metering_handle,
				'newspack_metering_settings',
				[
					'visible_paragraphs' => \get_post_meta( $gate_post_id, 'visible_paragraphs', true ),
					'use_more_tag'       => \get_post_meta( $gate_post_id, 'use_more_tag', true ),
					'count'              => \get_post_meta( $gate_post_id, 'metering_anonymous_count', true ),
					'period'             => \get_post_meta( $gate_post_id, 'metering_period', true ),
					'post_id'            => get_the_ID(),
				]
			);
		}
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
		\wp_localize_script(
			'newspack-memberships-gate',
			'newspack_memberships_gate',
			[
				'has_campaigns' => class_exists( 'Newspack_Popups' ),
			]
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
		if ( ! class_exists( 'WC_Memberships' ) ) {
			return false;
		}
		$post_id = self::get_gate_post_id();
		return $post_id && 'publish' === get_post_status( $post_id );
	}

	/**
	 * Whether the post is restricted for the current user.
	 *
	 * @param int $post_id Post ID.
	 *
	 * @return bool
	 */
	public static function is_post_restricted( $post_id = null ) {
		if ( ! class_exists( 'WC_Memberships' ) ) {
			return false;
		}
		if ( ! $post_id ) {
			$post_id = get_the_ID();
		}
		if ( ! function_exists( 'wc_memberships_is_post_content_restricted' ) || ! \wc_memberships_is_post_content_restricted( $post_id ) ) {
			return false;
		}
		return ! is_user_logged_in() || ! current_user_can( 'wc_memberships_view_restricted_post_content', $post_id );
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
	 * Get the inline gate content for rendering.
	 *
	 * @return string
	 */
	private static function get_inline_gate_content() {
		$gate_post_id = self::get_gate_post_id();
		$style        = \get_post_meta( $gate_post_id, 'style', true );
		if ( 'inline' !== $style ) {
			return '';
		}
		$gate = \apply_filters( 'the_content', \get_the_content( null, null, $gate_post_id ) );

		// Apply inline fade.
		if ( \get_post_meta( $gate_post_id, 'inline_fade', true ) ) {
			$gate = '<div style="pointer-events: none; height: 10em; margin-top: -10em; width: 100%; position: absolute; background: linear-gradient(180deg, rgba(255,255,255,0) 14%, rgba(255,255,255,1) 76%);"></div>' . $gate;
		}

		// Wrap gate in a div for styling.
		$gate = '<div class="newspack-memberships__gate">' . $gate . '</div>';
		return $gate;
	}

	/**
	 * Custom handling of content restriction when using frontend metering.
	 */
	public static function handle_metering_restriction() {
		if ( ! class_exists( 'WC_Memberships' ) ) {
			return;
		}
		if ( ! \is_singular() || ! self::is_post_restricted() ) {
			return;
		}

		// Remove the default restriction handler from 'SkyVerge\WooCommerce\Memberships\Restrictions\Posts::restrict_post'.
		if ( self::is_frontend_metering() || self::is_logged_in_metering_allowed() ) {
			$restriction_instance = \wc_memberships()->get_restrictions_instance()->get_posts_restrictions_instance();
			\remove_action( 'the_post', spl_object_hash( $restriction_instance ) . 'restrict_post', 0 );
		}

		// Add inline gate to the footer so it can be handled by the frontend.
		if ( self::is_frontend_metering() ) {
			\add_action(
				'wp_footer',
				function() {
					self::$gate_rendered = true;
					echo '<div style="display:none">' . self::get_inline_gate_content() . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				},
				1
			);
		}
	}

	/**
	 * Filter the notice HTML.
	 *
	 * @param string $notice Notice HTML.
	 * @param string $message_body original message content.
	 * @param string $message_code message code.
	 * @param array  $message_args associative array of message arguments.
	 */
	public static function notice_html( $notice, $message_body, $message_code, $message_args ) {
		// If the gate is not available, don't mess with the notice.
		if ( ! self::has_gate() ) {
			return $notice;
		}
		// Don't show gate unless attached to a specific post.
		if ( empty( $message_args['post'] ) ) {
			return '';
		}
		// If rendering the content in a loop, don't render the gate.
		if ( get_queried_object_id() !== get_the_ID() ) {
			return '';
		}
		self::$gate_rendered = true;
		return self::get_inline_gate_content();
	}

	/**
	 * Get the metering expiration time for the given date.
	 *
	 * @param string|\DateTime $datetime Date to calculate the expiration time for. Defaults to 'now'.
	 *
	 * @return int Timestamp of the expiration time.
	 */
	private static function get_expiration_time( $datetime = 'now' ) {
		$period = \get_post_meta( self::get_gate_post_id(), 'metering_period', true );
		if ( is_string( $datetime ) ) {
			$date = new \DateTime( $datetime );
		} else {
			$date = $datetime;
		}
		// Reset time to 00:00:00:000.
		$date->setTime( 0, 0, 0, 0 );
		switch ( $period ) {
			case 'day':
				$date->modify( '+1 day' );
				break;
			case 'week':
				$day         = $date->format( 'w' );
				$days_to_sat = 6 - $day;
				$date->modify( '+' . $days_to_sat . ' day' );
				break;
			case 'month':
				$date->setDate( $date->format( 'Y' ), $date->format( 'm' ), 1 );
				break;
		}
		return intval( $date->format( 'U' ), 10 );
	}

	/**
	 * Whether to use the frontend metering strategy.
	 *
	 * @return bool
	 */
	private static function is_frontend_metering() {
		if ( ! \is_singular() || ! self::has_gate() || ! self::is_post_restricted() ) {
			return false;
		}
		$gate_post_id    = self::get_gate_post_id();
		$metering        = \get_post_meta( $gate_post_id, 'metering', true );
		$anonymous_count = \get_post_meta( $gate_post_id, 'metering_anonymous_count', true );
		return $metering && ! empty( $anonymous_count ) && ! is_user_logged_in();
	}

	/**
	 * Whether to allow content rendering through metering for logged in users.
	 *
	 * @param int $post_id Optional post ID. Default is the current post.
	 *
	 * @return bool
	 */
	private static function is_logged_in_metering_allowed( $post_id = null ) {
		if ( ! $post_id ) {
			$post_id = get_the_ID();
		}

		// Metering back-end strategy is only for logged-in users.
		if ( ! is_user_logged_in() ) {
			return false;
		}

		$gate_post_id = self::get_gate_post_id();
		$metering     = \get_post_meta( $gate_post_id, 'metering', true );

		// Bail if metering is not enabled.
		if ( ! $metering ) {
			return false;
		}

		// Return cached value if available.
		if ( isset( self::$logged_in_metering_cache[ $post_id ] ) ) {
			return self::$logged_in_metering_cache[ $post_id ];
		}

		$current_expiration = self::get_expiration_time();
		$user_metering_data = \get_user_meta( get_current_user_id(), self::METERING_META_KEY, true );
		if ( ! is_array( $user_metering_data ) ) {
			$user_metering_data = [];
		}

		$expiration = isset( $user_metering_data['expiration'] ) ? $user_metering_data['expiration'] : 0;
		if ( $expiration !== $current_expiration ) {
			// Clear content if expired.
			if ( $expiration < $current_expiration ) {
				$user_metering_data['content'] = [];
			}
			// Reset expiration.
			$user_metering_data['expiration'] = $current_expiration;
		}

		$count = (int) \get_post_meta( $gate_post_id, 'metering_anonymous_count', true ) +
			(int) \get_post_meta( $gate_post_id, 'metering_registered_count', true );

		$limited          = count( $user_metering_data['content'] ) >= $count;
		$accessed_content = in_array( $post_id, $user_metering_data['content'], true );
		if ( ! $limited && ! $accessed_content ) {
			$user_metering_data['content'][] = $post_id;
		}

		\update_user_meta( get_current_user_id(), self::METERING_META_KEY, $user_metering_data );

		// Allowed if the content has been accessed or the metering limit has not been reached.
		$allowed = $accessed_content || ! $limited;

		self::$logged_in_metering_cache[ $post_id ] = $allowed;
		return $allowed;
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

		$style = \get_post_meta( $gate_post_id, 'style', true );

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
			if ( 'overlay' === $style ) {
				// Append ellipsis to the last paragraph.
				$content[ count( $content ) - 1 ] .= ' [&hellip;]';
			}
			// Rejoin the paragraphs into a single string again.
			$content = wp_kses_post( implode( '</p>', $content ) . '</p>' );
		}
		return $content;
	}

	/**
	 * Render the overlay gate.
	 */
	public static function render_overlay_gate() {
		if ( ! self::has_gate() ) {
			return;
		}
		// Only render overlay gate for a restricted singular content.
		if ( ! is_singular() || ! self::is_post_restricted() ) {
			return;
		}
		// Bail if rendering allowed and not frontend metering.
		if ( ! self::is_frontend_metering() && self::is_logged_in_metering_allowed() ) {
			return;
		}
		$gate_post_id = self::get_gate_post_id();
		$style        = \get_post_meta( $gate_post_id, 'style', true );
		if ( 'overlay' !== $style ) {
			return;
		}
		global $post;
		$_post = $post;
		$post  = \get_post( $gate_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );
		$position = \get_post_meta( $gate_post_id, 'overlay_position', true );
		$size     = \get_post_meta( $gate_post_id, 'overlay_size', true );
		?>
		<div class="newspack-memberships__gate newspack-memberships__overlay-gate" style="display:none;" data-position="<?php echo \esc_attr( $position ); ?>" data-size="<?php echo \esc_attr( $size ); ?>">
			<div class="newspack-memberships__overlay-gate__container">
				<div class="newspack-memberships__overlay-gate__content">
					<?php echo \apply_filters( 'the_content', \get_the_content( null, null, $gate_post_id ) );  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</div>
			</div>
		</div>
		<?php
		self::$gate_rendered = true;
		wp_reset_postdata();
		$post = $_post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * Render footer JS.
	 *
	 * If the gate was rendered, reload the page after 2 seconds in case RAS
	 * detects a new reader. This allows the membership purchase to unlock the
	 * content.
	 */
	public static function render_js() {
		if ( ! self::$gate_rendered ) {
			return;
		}
		?>
		<script type="text/javascript">
			window.newspackRAS = window.newspackRAS || [];
			window.newspackRAS.push( function( ras ) {
				ras.on( 'reader', function( ev ) {
					if ( ev.detail.authenticated ) {
						setTimeout( function() {
							window.location.reload();
						}, 2000 );
					}
				} );
			} );
		</script>
		<?php
	}

	/**
	 * Disable popups if rendering a restricted post.
	 *
	 * @param bool $disabled Whether popups are disabled.
	 *
	 * @return bool
	 */
	public static function disable_popups( $disabled ) {
		if ( self::has_gate() && self::is_post_restricted() ) {
			return true;
		}
		return $disabled;
	}
}
WC_Memberships::init();
