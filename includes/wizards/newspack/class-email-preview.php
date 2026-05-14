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

		return self::apply_sample_substitutions( $html );
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

		$template_data = include $configs[ $type ]['template'];
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
	 * @param string $html Source HTML containing *TOKEN* placeholders.
	 *
	 * @return string HTML with tokens substituted.
	 */
	private static function apply_sample_substitutions( string $html ): string {
		foreach ( self::get_sample_substitutions() as $token => $value ) {
			$html = str_replace( $token, $value, $html );
		}
		return $html;
	}

	/**
	 * Get the substitution map of email-template tokens to sample values.
	 *
	 * @return array Map of `*TOKEN*` => sample value.
	 */
	public static function get_sample_substitutions(): array {
		$site_logo_url   = wp_get_attachment_url( get_theme_mod( 'custom_logo' ) );
		$site_title      = get_bloginfo( 'name' );
		$site_url        = get_bloginfo( 'wpurl' );
		$reply_to_email  = function_exists( 'Newspack\Emails::get_reply_to_email' ) ? Emails::get_reply_to_email() : get_bloginfo( 'admin_email' );
		$site_address    = self::get_site_address();
		$site_contact    = $site_address
			? sprintf( '<strong>%s</strong> — %s', $site_title, $site_address )
			: $site_title;

		return [
			// Site / branding — real values from the publisher's config.
			'*SITE_TITLE*'             => $site_title,
			'*SITE_URL*'               => $site_url,
			'*SITE_LOGO*'              => $site_logo_url ? esc_url( $site_logo_url ) : '',
			'*SITE_ADDRESS*'           => $site_address,
			'*SITE_CONTACT*'           => $site_contact,
			'*CONTACT_EMAIL*'          => sprintf( '<a href="mailto:%s">%s</a>', $reply_to_email, $reply_to_email ),

			// Reader identity — stable sample values.
			'*BILLING_FIRST_NAME*'     => 'Sample',
			'*BILLING_LAST_NAME*'      => 'Reader',
			'*BILLING_NAME*'           => 'Sample Reader',
			'*PENDING_EMAIL_ADDRESS*'  => 'sample.reader@example.com',

			// Transaction / subscription details — stable sample values.
			'*AMOUNT*'                 => '$25.00',
			'*PAYMENT_METHOD*'         => 'Visa ending in 4242',
			'*PRODUCT_NAME*'           => 'Monthly Membership',
			'*BILLING_FREQUENCY*'      => 'monthly',
			'*DATE*'                  => gmdate( get_option( 'date_format', 'F j, Y' ) ),
			'*CANCELLATION_TITLE*'     => __( 'Subscription Cancelled', 'newspack-plugin' ),
			'*CANCELLATION_TYPE*'      => __( 'subscription', 'newspack-plugin' ),

			// Action URLs — anchors so preview clicks don't navigate.
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

			// OTP code — stable sample value.
			'*MAGIC_LINK_OTP*'         => '123456',
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
		if ( ! $post || Emails::POST_TYPE !== $post->post_type ) {
			return new \WP_Error(
				'newspack_email_preview_not_found',
				__( 'Email not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$html = self::get_preview_html( $post_id );
		if ( false === $html ) {
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
