<?php
/**
 * Newspack Restricted Content Access Rules
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation;
use Newspack\WooCommerce_Connection;

/**
 * Main class.
 */
class Access_Rules {

	const META_KEY = 'access_rules';

	/**
	 * Get the available access rules.
	 *
	 * @return array
	 */
	public static function get_access_rules_config() {
		$access_rules_config = [
			'registration' => [
				'name'        => 'Is Registered',
				'description' => 'The user must be logged into a reader account.',
				'type'        => 'boolean',
				'default'     => false,
				'callback'    => [ __CLASS__, 'is_registered' ],
				'conflicts'   => [ 'subscription' ],
			],
			'subscription' => [
				'name'        => 'Has Active Subscription',
				'description' => 'The user must be logged into a reader account and have an active subscription with one of the selected products.',
				'type'        => 'array',
				'default'     => [],
				'callback'    => [ __CLASS__, 'has_active_subscription' ],
				'conflicts'   => [ 'registration' ],
			],
			'email_domain' => [
				'name'        => 'Has Whitelisted Email Domain',
				'description' => 'The user must be logged into a reader account whose email address contains one of these domains. Specify multiple domains by separating them with a comma or line break.',
				'type'        => 'string',
				'placeholder' => 'example.com,another.com',
				'default'     => '',
				'callback'    => [ __CLASS__, 'is_email_domain_whitelisted' ],
			],
		];

		return apply_filters( 'newspack_content_gate_access_rules', $access_rules_config );
	}

	/**
	 * Get an access rule by slug.
	 *
	 * @param string $slug Access rule slug.
	 * @return array|null Access rule config or null if not found.
	 */
	public static function get_access_rule_config( $slug ) {
		$access_rules = self::get_access_rules_config();
		return $access_rules[ $slug ] ?? null;
	}

	/**
	 * Get access rules for bypassing a content gate.
	 *
	 * @param int $post_id Post ID.
	 * @return string[] Array of access rule slugs.
	 */
	public static function get_access_rules_for_post( $post_id ) {
		$access_rules = \get_post_meta( $post_id, self::META_KEY, true );
		return $access_rules ?? [];
	}

	/**
	 * Evaluate whether the given or current user can bypass the given access rule.
	 *
	 * @param string   $access_rule Access rule slug.
	 * @param mixed    $args Additional arguments for the access rule callback.
	 * @param int|null $user_id User ID. If not given, checks the current user.
	 * @return bool
	 */
	public static function evaluate_access_rule( $access_rule, $args = null, $user_id = null ) {
		$access_rule_config = self::get_access_rule_config( $access_rule );

		// Rule doesn't exist or lacks a callback function to execute, don't block access for it.
		if ( empty( $access_rule_config['callback'] ) ) {
			return true;
		}

		// If evaluating for the current user, they must be logged in.
		$user_id = $user_id ?? \get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		// Access rule must have a callable callback function.
		$access_rule_callback = $access_rule_config['callback'];
		if ( ! is_callable( $access_rule_callback ) ) {
			return false;
		}
		return call_user_func( $access_rule_callback, $user_id, $args );
	}

	/**
	 * Whether the user is logged into a registered reader account.
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	public static function is_registered( $user_id ) {
		return Reader_Activation::is_user_reader( \get_userdata( $user_id ), true );
	}

	/**
	 * Whether the user has an active subscription for one of the given products.
	 *
	 * @param int   $user_id User ID.
	 * @param array $product_ids Required product IDs.
	 * @return bool
	 */
	public static function has_active_subscription( $user_id, $product_ids ) {
		return ! empty( WooCommerce_Connection::get_active_subscriptions_for_user( $user_id, $product_ids ) );
	}

	/**
	 * Whether the user’s email address contains one of the given domains.
	 *
	 * @param int    $user_id User ID.
	 * @param string $domains Comma-delimited list of domains.
	 * @return bool
	 */
	public static function is_email_domain_whitelisted( $user_id, $domains ) {
		// If no domains are specified, allow access.
		if ( empty( $domains ) ) {
			return true;
		}
		$domains = str_replace( PHP_EOL, ',', $domains );
		$domains = explode( ',', $domains );
		$domains = array_map( 'trim', $domains );
		$user    = \get_userdata( $user_id );
		if ( ! $user ) {
			return false;
		}
		$email = $user->data->user_email;
		if ( ! $email ) {
			return false;
		}
		$email_domain = substr( $email, strrpos( $email, '@' ) + 1 );
		return in_array( $email_domain, $domains, true );
	}
}
