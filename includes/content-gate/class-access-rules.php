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
	/**
	 * Get the available access rules.
	 *
	 * @return array
	 */
	public static function get_access_rules() {
		$access_rules_config = [
			'registration' => [
				'name'        => 'Is Registered',
				'description' => 'The user must be logged into a registered reader account.',
				'type'        => 'boolean',
				'default'     => false,
				'callback'    => [ __CLASS__, 'is_registered' ],
			],
			'subscription' => [
				'name'        => 'Has Active Subscription',
				'description' => 'The user must have an active subscription for one of the selected products.',
				'type'        => 'array',
				'default'     => [],
				'callback'    => [ __CLASS__, 'has_active_subscription' ],
			],
			'email_domain' => [
				'name'        => 'Email Domain Whitelist',
				'description' => 'The user’s email address must contain one of these domains. Specify multiple domains by separating them with a comma.',
				'type'        => 'string',
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
	public static function get_access_rule( $slug ) {
		$access_rules = self::get_access_rules();
		return $access_rules[ $slug ] ?? null;
	}

	/**
	 * Whether the user is logged into a registered reader account.
	 *
	 * @return bool
	 */
	public static function is_registered() {
		return \is_user_logged_in() && Reader_Activation::is_user_reader( \wp_get_current_user(), true );
	}

	/**
	 * Whether the user has an active subscription for one of the given products.
	 *
	 * @param array $product_ids Required product IDs.
	 * @return bool
	 */
	public static function has_active_subscription( $product_ids ) {
		return \is_user_logged_in() && ! empty( WooCommerce_Connection::get_active_subscriptions_for_user( \get_current_user_id(), $product_ids ) );
	}

	/**
	 * Whether the user’s email address contains one of the given domains.
	 *
	 * @param string $domains Comma-delimited list of domains.
	 * @return bool
	 */
	public static function is_email_domain_whitelisted( $domains ) {
		// If no domains are specified, allow access.
		if ( empty( $domains ) ) {
			return true;
		}
		$domains = explode( ',', $domains );
		$user    = \wp_get_current_user();
		if ( ! $user ) {
			return false;
		}
		$email = $user->user_email;
		if ( ! $email ) {
			return false;
		}
		$email_domain = substr( $email, strrpos( $email, '@' ) + 1 );
		return in_array( $email_domain, $domains, true );
	}
}
