<?php
/**
 * Newspack Content Gifting functionality.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;

/**
 * Content Gifting class.
 */
class Content_Gifting {
	/**
	 * The query arg for the content key.
	 *
	 * @var string
	 */
	const QUERY_ARG = 'content_key';

	/**
	 * The action for the content key generation.
	 *
	 * @var string
	 */
	const GENERATE_ACTION = 'newspack_generate_content_key';

	/**
	 * The expiration time for the content key.
	 *
	 * @var int
	 */
	const KEY_EXPIRATION = 3600 * 24; // 24 hours

	/**
	 * The number of allowed simultaneous content keys per user.
	 *
	 * @var int
	 */
	const USER_KEY_LIMIT = 5;

	/**
	 * The meta for content gifting, both enabled option and user keys.
	 *
	 * @var string
	 */
	const META = 'newspack_content_gifting';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'template_redirect', [ __CLASS__, 'process_key_request' ] );
		add_action( 'wp', [ __CLASS__, 'unrestrict_content' ], 5 );
		add_filter( 'newspack_content_gate_restrict_post', [ __CLASS__, 'restrict_post' ] );
		add_action( 'newspack_theme_entry_meta', [ __CLASS__, 'add_gift_button' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ] );
	}

	/**
	 * Whether content gifting is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$enabled = (bool) get_option( self::META, false );

		/**
		 * Filters whether content gifting is enabled.
		 *
		 * @param bool $enabled Whether content gifting is enabled.
		 */
		return apply_filters( 'newspack_content_gifting_enabled', $enabled );
	}

	/**
	 * Set the enabled status.
	 *
	 * @param bool $enabled Whether the content gifting is enabled.
	 *
	 * @return void
	 */
	public static function set_enabled( $enabled = true ) {
		update_option( self::META, (int) $enabled );
	}

	/**
	 * Enqueue assets.
	 */
	public static function enqueue_assets() {
		wp_enqueue_style( 'newspack-memberships-content-gifting', Newspack::plugin_url() . '/dist/content-gifting.css', [], NEWSPACK_PLUGIN_VERSION );
	}

	/**
	 * Process the content key request.
	 */
	public static function process_key_request() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		if ( ! isset( $_GET[ self::GENERATE_ACTION ] ) || ! wp_verify_nonce( sanitize_text_field( $_GET[ self::GENERATE_ACTION ] ), self::GENERATE_ACTION ) ) {
			return;
		}

		$key = self::generate_key( get_the_ID() );
		$url = '';
		if ( ! is_wp_error( $key ) ) {
			$url = add_query_arg( self::QUERY_ARG, $key, get_the_permalink() );
		}

		// Render instructions modal in the footer.
		add_action(
			'wp_footer',
			function() use ( $key, $url ) {
				?>
				<div class="newspack-ui">
					<div class="newspack-ui__modal-container" data-state="open">
						<div class="newspack-ui__modal-container__overlay"></div>
						<div class="newspack-ui__modal newspack-ui__modal--small">
							<header class="newspack-ui__modal__header">
								<h2 class="newspack-ui__font--l"><?php esc_html_e( 'Gift this article', 'newspack-plugin' ); ?></h2>
								<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close">
									<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
									<?php Newspack_UI_Icons::print_svg( 'close' ); ?>
								</button>
							</header>
							<div class="newspack-ui__modal__content">
								<?php if ( is_wp_error( $key ) ) : ?>
									<div class="newspack-ui__notice newspack-ui__notice--error">
										<?php echo esc_html( $key->get_error_message() ); ?>
									</div>
								<?php else : ?>
									<p>
										<?php esc_html_e( 'Share the link below to gift this article to a friend. The access is valid for 24 hours.', 'newspack-plugin' ); ?>
									</p>
									<p>
										<label for="content-gifting-url"><?php esc_html_e( 'Link', 'newspack-plugin' ); ?></label>
										<input type="text" id="content-gifting-url" value="<?php echo esc_attr( $url ); ?>" readonly>
									</p>
								<?php endif; ?>
							</div>
						</div>
					</div>
				</div>
				<?php
			}
		);
	}

	/**
	 * Add the gift button to the entry meta.
	 */
	public static function add_gift_button() {
		if ( ! self::can_gift_post() ) {
			return;
		}
		$url = add_query_arg( self::GENERATE_ACTION, wp_create_nonce( self::GENERATE_ACTION ), get_the_permalink() );
		?>
		<a href="<?php echo esc_url( $url ); ?>" class="newspack-content-gifting__gift-button">
			<?php Newspack_UI_Icons::print_svg( 'gift' ); ?>
			<?php esc_html_e( 'Gift this article', 'newspack-plugin' ); ?>
		</a>
		<?php
	}

	/**
	 * Handle the content key query arg to unrestrict content.
	 */
	public static function unrestrict_content() {
		if ( ! isset( $_GET[ self::QUERY_ARG ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		if ( ! is_singular() ) {
			return;
		}

		$key_data = self::get_key_data( get_the_ID(), sanitize_text_field( $_GET[ self::QUERY_ARG ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( ! $key_data ) {
			return;
		}

		if ( ! function_exists( 'wc_memberships' ) ) {
			return;
		}

		$restriction_instance = \wc_memberships()->get_restrictions_instance()->get_posts_restrictions_instance();
		\remove_action( 'wp', spl_object_hash( $restriction_instance ) . 'handle_restriction_modes', 9 );
		\remove_action( 'wp', spl_object_hash( $restriction_instance ) . 'handle_restriction_modes' ); // For compatibility with Woo Memberships < 1.27.2.
		\add_filter( 'wc_memberships_restrictable_comment_types', '__return_empty_array' );
		\add_filter( 'newspack_can_render_overlay_gate', '__return_false' );
	}

	/**
	 * Whether to restrict the post.
	 *
	 * @param bool $restrict Whether to restrict the post.
	 * @param int  $post_id  Post ID.
	 *
	 * @return bool
	 */
	public static function restrict_post( $restrict, $post_id ) {
		if ( ! isset( $_GET[ self::QUERY_ARG ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return $restrict;
		}
		$key_data = self::get_key_data( $post_id, sanitize_text_field( $_GET[ self::QUERY_ARG ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $key_data ) {
			return false;
		}
		return $restrict;
	}

	/**
	 * Whether the current user can gift a given post.
	 *
	 * @param int|null $post_id       Optional post ID. Default is the current post.
	 * @param bool     $return_errors Whether to return errors instead of a boolean.
	 *
	 * @return bool|WP_Error Whether the user can gift the post or an error.
	 */
	public static function can_gift_post( $post_id = null, $return_errors = false ) {
		$post_id = $post_id ?? get_the_ID();
		$errors  = new WP_Error();

		if ( ! self::is_enabled() ) {
			$errors->add( 'not_enabled', __( 'Content gifting is not enabled.', 'newspack-plugin' ) );
		}

		if ( ! is_user_logged_in() ) {
			$errors->add( 'not_logged_in', __( 'You must be logged in to gift content.', 'newspack-plugin' ) );
		}

		if ( Content_Gate::is_post_restricted( $post_id ) ) {
			$errors->add( 'post_restricted', __( 'User does not have access to this post.', 'newspack-plugin' ) );
		}

		if ( Metering::has_metering( $post_id ) ) {
			$errors->add( 'metering', __( 'Metered content cannot be gifted.', 'newspack-plugin' ) );
		}

		if ( $return_errors ) {
			return $errors;
		}

		/**
		 * Filters whether the current user can gift a given post.
		 *
		 * @param bool $can_gift Whether the user can gift the post.
		 * @param int  $user_id  The user ID.
		 * @param int  $post_id  The post ID.
		 */
		return apply_filters( 'newspack_user_can_gift_post', ! $errors->has_errors(), get_current_user_id(), $post_id );
	}

	/**
	 * Get the data for a content key.
	 *
	 * @param int    $post_id The post ID.
	 * @param string $key     The content key.
	 *
	 * @return array|false The data for the content key or false if invalid.
	 */
	public static function get_key_data( $post_id, $key ) {
		if ( ! self::is_enabled() ) {
			return false;
		}

		$parsed_key = explode( '|', $key );
		if ( count( $parsed_key ) !== 2 ) {
			return false;
		}

		$user_id = (int) $parsed_key[0];

		if ( ! $user_id ) {
			return false;
		}

		$data = get_user_meta( $user_id, self::META, true );
		if ( ! $data || ! isset( $data['keys'] ) ) {
			return false;
		}

		foreach ( $data['keys'] as $post_id => $item ) {
			if ( $item['timestamp'] + self::KEY_EXPIRATION < time() ) {
				unset( $item['keys'][ $post_id ] );
			}
		}

		if ( ! isset( $data['keys'][ $post_id ] ) ) {
			return false;
		}

		if ( $data['keys'][ $post_id ]['key'] !== $parsed_key[1] ) {
			return false;
		}

		return $data['keys'][ $post_id ];
	}

	/**
	 * Generate a key for a restricted post.
	 *
	 * @param int $post_id The post ID.
	 *
	 * @return string|WP_Error The key or error.
	 */
	public static function generate_key( $post_id ) {
		if ( ! self::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Content gifting is not enabled.', 'newspack-plugin' ) );
		}

		if ( ! self::can_gift_post( $post_id ) ) {
			return new WP_Error( 'not_allowed', __( 'You are not allowed to generate a content key.', 'newspack-plugin' ) );
		}

		$user_id = get_current_user_id();

		$user_keys = get_user_meta( $user_id, self::META, true );
		if ( ! $user_keys ) {
			$user_keys = [ 'keys' => [] ];
		}

		// Cleanup expired keys.
		foreach ( $user_keys['keys'] as $key => $data ) {
			if ( $data['timestamp'] + self::KEY_EXPIRATION < time() ) {
				unset( $user_keys['keys'][ $key ] );
			}
		}

		// Return existing key if found.
		if ( isset( $user_keys['keys'][ $post_id ] ) ) {
			return $user_id . '|' . $user_keys['keys'][ $post_id ]['key'];
		}

		// Check if the user has reached the limit for simultaneous content keys.
		if ( count( $user_keys['keys'] ) >= self::USER_KEY_LIMIT ) {
			return new WP_Error( 'user_key_limit_reached', __( 'You have reached the limit for simultaneous content keys.', 'newspack-plugin' ) );
		}

		// Add the new key.
		$key = wp_generate_password( 32, false );

		$user_keys['keys'][ $post_id ] = [
			'key'       => $key,
			'timestamp' => time(),
		];
		update_user_meta( $user_id, self::META, $user_keys );

		return $user_id . '|' . $key;
	}
}
Content_Gifting::init();
