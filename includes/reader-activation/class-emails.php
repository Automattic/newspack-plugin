<?php
/**
 * Newspack Reader Activation Emails functionality.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Reader Activation Emails class.
 */
final class Emails {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		if ( Reader_Activation::is_enabled() ) {
			\add_filter( 'wp_new_user_notification_email', [ __CLASS__, 'get_reader_registration_email' ], 20, 3 );
			\add_filter( 'newspack_magic_link_email', [ __CLASS__, 'get_reader_magic_link_email' ], 20, 3 );
		}
	}

	/**
	 * Get reader registration notification email.
	 *
	 * @param array   $wp_new_user_notification_email {
	 *     Used to build wp_mail().
	 *
	 *     @type string $to      The intended recipient - New user email address.
	 *     @type string $subject The subject of the email.
	 *     @type string $message The body of the email.
	 *     @type string $headers The headers of the email.
	 * }
	 * @param WP_User $user     User object for new user.
	 * @param string  $blogname The site title.
	 */
	public static function get_reader_registration_email( $wp_new_user_notification_email, $user, $blogname ) {
		if ( Reader_Activation::is_user_reader( $user ) ) { // phpcs:ignore
			/**
			 * TODO: Use page with MJML rendering to format email.
			 * See \Newspack\Reader_Revenue_Emails for reference.
			 */
		}
		return $wp_new_user_notification_email;
	}

	/**
	 * Get reader registration notification email.
	 *
	 * @param array   $args {
	 *     Used to build wp_mail().
	 *
	 *     @type string $to      The intended recipient - New user email address.
	 *     @type string $subject The subject of the email.
	 *     @type string $message The body of the email.
	 *     @type string $headers The headers of the email.
	 * }
	 * @param WP_User $user       User object for new user.
	 * @param string  $magic_link The magic link url.
	 */
	public static function get_reader_magic_link_email( $args, $user, $magic_link ) {
		if ( Reader_Activation::is_user_reader( $user ) ) { // phpcs:ignore
			/**
			 * TODO: Use page with MJML rendering to format email.
			 * See \Newspack\Reader_Revenue_Emails for reference.
			 */
		}
		return $args;
	}
}
Emails::init();
