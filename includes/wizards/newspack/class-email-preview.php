<?php
/**
 * Email preview rendering for the Settings → Emails screen.
 *
 * Renders a publisher-facing preview of a transactional email by substituting
 * known template tokens with realistic sample values. Used by the unified
 * email management UI to display a per-card thumbnail.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Emails;
use Newspack\Logger;
use Newspack_Newsletters;

defined( 'ABSPATH' ) || exit;

/**
 * Email Preview Class.
 */
class Email_Preview {

	/**
	 * Get the rendered HTML for an email post, with sample token values substituted.
	 *
	 * Falls back to the registered template file's HTML when the post's saved
	 * EMAIL_HTML_META is empty (i.e. the email has never been customized).
	 *
	 * @param int $post_id ID of the email post.
	 *
	 * @return string|false Rendered HTML, or false if the email can't be resolved.
	 */
	public static function get_preview_html( int $post_id ) {
		if ( ! self::is_supported() ) {
			return false;
		}

		$html = self::get_source_html( $post_id );
		if ( empty( $html ) ) {
			return false;
		}

		return self::apply_sample_substitutions( $html, $post_id );
	}

	/**
	 * Get the source HTML for an email post.
	 *
	 * Reads the saved EMAIL_HTML_META first; falls back to the registered
	 * template's default email_html when that meta is empty.
	 *
	 * @param int $post_id ID of the email post.
	 *
	 * @return string Source HTML, or empty string if unavailable.
	 */
	private static function get_source_html( int $post_id ): string {
		$html = get_post_meta( $post_id, Newspack_Newsletters::EMAIL_HTML_META, true );
		if ( ! empty( $html ) ) {
			return $html;
		}

		// Fallback: look up the registered template for this post type and use its default HTML.
		$type = get_post_meta( $post_id, Emails::EMAIL_CONFIG_NAME_META, true );
		if ( empty( $type ) ) {
			return '';
		}

		// Trigger the template load by requesting the email config. This is the
		// same path Emails::get_email_config_by_type() uses; we just want the
		// raw template HTML, which is available via reflection on the loaded config.
		$configs = apply_filters( 'newspack_email_configs', [] );
		if ( ! isset( $configs[ $type ], $configs[ $type ]['template'] ) ) {
			return '';
		}

		$template_path = $configs[ $type ]['template'];
		if ( ! is_readable( $template_path ) ) {
			return '';
		}

		$template_data = include $template_path;
		if ( ! is_array( $template_data ) || empty( $template_data['email_html'] ) ) {
			return '';
		}

		return $template_data['email_html'];
	}

	/**
	 * Apply sample-value substitutions to email HTML.
	 *
	 * Site/branding tokens use the publisher's real site config (so the preview
	 * reflects their actual branding). Reader/transaction tokens use stable
	 * fake values. Action URLs are replaced with anchor placeholders so
	 * preview iframes don't trigger live navigation.
	 *
	 * @param string $html    Source HTML containing *TOKEN* placeholders.
	 * @param int    $post_id The email post being previewed (passed to the filter).
	 *
	 * @return string HTML with tokens substituted.
	 */
	private static function apply_sample_substitutions( string $html, int $post_id = 0 ): string {
		$substitutions = self::get_sample_substitutions();

		/**
		 * Filters the sample substitution map used for email previews.
		 *
		 * The map is structured as three sub-arrays keyed by escaping context:
		 * - 'html': Tokens rendered as visible text (escaped with esc_html()).
		 * - 'url':  Tokens used in href/src attributes (escaped with esc_url()).
		 * - 'raw':  Tokens containing pre-escaped HTML (not escaped again).
		 *
		 * @param array $substitutions Structured map of `*TOKEN*` => sample value.
		 * @param int   $post_id       The email post being previewed (0 if unknown).
		 */
		$substitutions = apply_filters( 'newspack_email_preview_substitutions', $substitutions, $post_id );

		// Escape HTML-text tokens.
		$html_map = array_map( 'esc_html', $substitutions['html'] );
		// Escape URL tokens.
		$url_map = array_map( 'esc_url', $substitutions['url'] );
		// Raw tokens are already safe (contain pre-escaped markup).
		$raw_map = $substitutions['raw'];

		return strtr( $html, array_merge( $html_map, $url_map, $raw_map ) );
	}

	/**
	 * Get the substitution map of email-template tokens to sample values.
	 *
	 * Returns a three-key array grouped by escaping context:
	 * - 'html': Tokens rendered as visible text (escaped with esc_html() at call site).
	 * - 'url':  Tokens used in href/src attributes (escaped with esc_url() at call site).
	 * - 'raw':  Tokens containing pre-escaped HTML markup (not escaped again).
	 *
	 * @return array{ html: array<string, string>, url: array<string, string>, raw: array<string, string> }
	 */
	public static function get_sample_substitutions(): array {
		$site_logo_url   = wp_get_attachment_url( get_theme_mod( 'custom_logo' ) );
		$site_title      = get_bloginfo( 'name' );
		$site_url        = get_bloginfo( 'wpurl' );
		$reply_to_email  = Emails::get_reply_to_email();
		$site_address    = self::get_site_address();
		$site_contact    = $site_address
			? sprintf( '<strong>%s</strong> — %s', $site_title, $site_address )
			: $site_title;

		return [
			// Tokens rendered as visible text inside HTML — escaped with esc_html().
			'html' => [
				// Site / branding — real values from the publisher's config.
				'*SITE_TITLE*'            => $site_title,
				'*SITE_ADDRESS*'          => $site_address,

				// Reader identity — stable sample values.
				'*BILLING_FIRST_NAME*'    => __( 'Sample', 'newspack-plugin' ),
				'*BILLING_LAST_NAME*'     => __( 'Reader', 'newspack-plugin' ),
				'*BILLING_NAME*'          => __( 'Sample Reader', 'newspack-plugin' ),
				'*PENDING_EMAIL_ADDRESS*' => 'sample.reader@example.com',

				// Transaction / subscription details.
				'*AMOUNT*'                => '$25.00',
				'*PAYMENT_METHOD*'        => __( 'Visa ending in 4242', 'newspack-plugin' ),
				'*PRODUCT_NAME*'          => __( 'Monthly Membership', 'newspack-plugin' ),
				'*BILLING_FREQUENCY*'     => __( 'monthly', 'newspack-plugin' ),
				'*DATE*'                  => wp_date( get_option( 'date_format', 'F j, Y' ) ),
				'*CANCELLATION_TITLE*'    => __( 'Subscription Cancelled', 'newspack-plugin' ),
				'*CANCELLATION_TYPE*'     => __( 'subscription', 'newspack-plugin' ),

				// Card expiry warning details.
				'*CARD_LAST_4*'           => '4242',
				'*EXPIRY_DATE*'           => '12/2026',
				'*RENEWAL_DATE*'          => wp_date( get_option( 'date_format', 'F j, Y' ), strtotime( '+1 year' ) ),

				// OTP code — stable sample value.
				'*MAGIC_LINK_OTP*'        => '123456',
			],

			// Tokens used in href/src attributes — escaped with esc_url().
			'url'  => [
				'*SITE_URL*'               => $site_url,
				'*SITE_LOGO*'              => $site_logo_url ? $site_logo_url : '',
				'*ACCOUNT_URL*'            => '#',
				'*CANCELLATION_URL*'       => '#',
				'*EMAIL_CANCELLATION_URL*' => '#',
				'*EMAIL_VERIFICATION_URL*' => '#',
				'*VERIFICATION_URL*'       => '#',
				'*RECEIPT_URL*'            => '#',
				'*MAGIC_LINK_URL*'         => '#',
				'*PASSWORD_RESET_LINK*'    => '#',
				'*SET_PASSWORD_LINK*'      => '#',
				'*DELETION_LINK*'          => '#',
				'*WP_LOGIN_URL*'           => '#',
				'*UPDATE_PAYMENT_URL*'     => '#',
			],

			// Tokens containing pre-escaped HTML — NOT escaped again.
			'raw'  => [
				'*CONTACT_EMAIL*' => sprintf( '<a href="%s">%s</a>', esc_url( 'mailto:' . $reply_to_email ), esc_html( $reply_to_email ) ),
				'*SITE_CONTACT*'  => $site_contact,
			],
		];
	}

	/**
	 * Get the site's store address as a formatted string.
	 *
	 * Mirrors the logic in Emails::get_email_payload() so the preview
	 * shows the same address format the real email would use.
	 *
	 * @return string Formatted site address, or empty string.
	 */
	private static function get_site_address(): string {
		if ( class_exists( 'WC' ) ) {
			$base_address  = WC()->countries->get_base_address();
			$base_city     = WC()->countries->get_base_city();
			$base_postcode = WC()->countries->get_base_postcode();
		} else {
			$base_address  = get_option( 'woocommerce_store_address', '' );
			$base_city     = get_option( 'woocommerce_store_city', '' );
			$base_postcode = get_option( 'woocommerce_store_postcode', '' );
		}

		if ( ! $base_address ) {
			return '';
		}

		if ( ! $base_city && ! $base_postcode ) {
			return $base_address;
		}

		return sprintf(
			/* translators: 1: street address, 2: city, 3: postcode. */
			__( '%1$s, %2$s %3$s', 'newspack-plugin' ),
			$base_address,
			$base_city,
			$base_postcode
		);
	}

	/**
	 * Get rendered preview HTML for a WooCommerce block-editor email template.
	 *
	 * Tries the block-editor render path first (BlockEmailRenderer) which
	 * produces HTML styled with the site's theme.json colors and logo — the
	 * same output the block email editor preview shows. Falls back to
	 * EmailPreview::render() (legacy WC template with woocommerce_email_*
	 * option colors) if the block path is unavailable or fails.
	 *
	 * @param int $post_id ID of the woo_email post.
	 *
	 * @return string|false Rendered HTML, or false if unavailable.
	 */
	private static function get_wc_preview_html( int $post_id ) {
		$manager_class = 'Automattic\\WooCommerce\\Internal\\EmailEditor\\WCTransactionalEmails\\WCTransactionalEmailPostsManager';
		$preview_class = 'Automattic\\WooCommerce\\Internal\\Admin\\EmailPreview\\EmailPreview';

		if ( ! class_exists( $manager_class ) || ! class_exists( $preview_class ) ) {
			return false;
		}

		// Reverse-lookup: post ID → email class name (e.g. 'WC_Email_New_Order').
		$email_class_name = $manager_class::get_instance()->get_email_type_class_name_from_post_id( $post_id );
		if ( empty( $email_class_name ) ) {
			return false;
		}

		// Check transient cache (block render is ~180 ms per email).
		$cache_key = self::get_wc_preview_cache_key( $post_id );
		$cached    = get_transient( $cache_key );
		if ( is_string( $cached ) && '' !== $cached ) {
			return $cached;
		}

		// Set up the WC_Email with a dummy order/user so both render paths
		// have realistic sample data to work with.
		try {
			$preview = $preview_class::instance();
			$preview->set_email_type( $email_class_name );
		} catch ( \Throwable $e ) {
			return false;
		}

		// Try the block-editor render path (themed, with site logo + theme colors).
		$block_html = self::try_block_render( $preview, $post_id, $email_class_name );
		if ( ! empty( $block_html ) ) {
			set_transient( $cache_key, $block_html, HOUR_IN_SECONDS );
			return $block_html;
		}

		// Fallback: legacy render via EmailPreview (WC default styling).
		try {
			$html = $preview->render();
			if ( ! empty( $html ) ) {
				set_transient( $cache_key, $html, HOUR_IN_SECONDS );
			}
			return $html;
		} catch ( \Throwable $e ) {
			return false;
		}
	}

	/**
	 * Build the transient cache key for a WC email preview.
	 *
	 * Includes the post's modified date so the cache naturally misses
	 * after an edit — this is the sole invalidation mechanism. Old
	 * transients expire via TTL.
	 *
	 * @param int $post_id The woo_email post ID.
	 * @return string Transient key (max 172 chars — within the 172-char limit).
	 */
	private static function get_wc_preview_cache_key( int $post_id ): string {
		$post     = get_post( $post_id );
		$modified = $post ? strtotime( $post->post_modified_gmt ) : 0;
		return 'newspack_wc_email_preview_' . $post_id . '_' . $modified;
	}

	/**
	 * Attempt to render a WC email through the block-editor pipeline.
	 *
	 * Uses BlockEmailRenderer::maybe_render_block_email() which renders
	 * through the email-editor package's Renderer — applying theme.json
	 * global styles, CSS inlining, and personalization tag replacement.
	 *
	 * @param object $preview          WC EmailPreview instance (with email type already set).
	 * @param int    $post_id          The woo_email post ID being previewed.
	 * @param string $email_class_name The WC_Email class name (for logging).
	 *
	 * @return string|null Rendered HTML, or null if the block path is unavailable.
	 */
	private static function try_block_render( $preview, int $post_id, string $email_class_name ): ?string {
		$renderer_class = 'Automattic\\WooCommerce\\Internal\\EmailEditor\\BlockEmailRenderer';

		if ( ! class_exists( $renderer_class ) || ! function_exists( 'wc_get_container' ) ) {
			Logger::log(
				"BlockEmailRenderer not available for woo_email post $post_id ($email_class_name); using legacy preview.",
				'NEWSPACK-EMAILS',
				'warning'
			);
			return null;
		}

		try {
			$preview->set_up_filters();
			$renderer = wc_get_container()->get( $renderer_class );
			$html     = $renderer->maybe_render_block_email( $preview->get_email() );
			$preview->clean_up_filters();

			if ( empty( $html ) ) {
				Logger::log(
					"BlockEmailRenderer returned empty for woo_email post $post_id ($email_class_name); using legacy preview.",
					'NEWSPACK-EMAILS',
					'warning'
				);
				return null;
			}

			return $html;
		} catch ( \Throwable $e ) {
			$preview->clean_up_filters();
			Logger::log(
				'BlockEmailRenderer threw ' . get_class( $e ) . " for woo_email post $post_id ($email_class_name): " . $e->getMessage() . '; using legacy preview.',
				'NEWSPACK-EMAILS',
				'warning'
			);
			return null;
		}
	}

	/**
	 * Is email preview supported on this install?
	 *
	 * Requires Newspack Newsletters (the same dependency that gates
	 * email management in general).
	 *
	 * @return bool
	 */
	private static function is_supported(): bool {
		return class_exists( 'Newspack_Newsletters' );
	}

	/**
	 * Initialize the class. Hooked from class-newspack.php inclusion.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_routes' ] );
	}

	/**
	 * Register the email-preview REST endpoint.
	 *
	 * @codeCoverageIgnore
	 */
	public static function register_rest_routes(): void {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'wizard/newspack-settings/emails/(?P<post_id>\d+)/preview',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_preview' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'post_id' => [
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * REST handler: return preview HTML for an email post.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function api_get_preview( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		$post = get_post( $post_id );
		if ( ! $post ) {
			return new \WP_Error(
				'newspack_email_preview_not_found',
				__( 'Email not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		if ( 'woo_email' === $post->post_type ) {
			$html = self::get_wc_preview_html( $post_id );
		} elseif ( Emails::POST_TYPE === $post->post_type ) {
			$html = self::get_preview_html( $post_id );
		} else {
			return new \WP_Error(
				'newspack_email_preview_not_found',
				__( 'Email not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		if ( false === $html || empty( $html ) ) {
			return new \WP_Error(
				'newspack_email_preview_unavailable',
				__( 'Email preview is unavailable.', 'newspack-plugin' ),
				[ 'status' => 500 ]
			);
		}

		return rest_ensure_response(
			[
				'html'    => $html,
				'post_id' => $post_id,
			]
		);
	}

	/**
	 * Permissions check for the preview endpoint. Mirrors other Newspack email endpoints.
	 *
	 * @codeCoverageIgnore
	 * @return bool|\WP_Error
	 */
	public static function api_permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack-plugin' ),
				[ 'status' => 403 ]
			);
		}
		return true;
	}
}


Email_Preview::init();
