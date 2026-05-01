<?php
/**
 * Content Gate contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;
use Newspack\Access_Rules;
use Newspack\Content_Gate as Content_Gate_CPT;
use Newspack\Group_Subscription;
use Newspack\Group_Subscription_Settings;
use Newspack\Institution;
use Newspack\User_Gate_Access;
use Newspack\WooCommerce_Connection;

defined( 'ABSPATH' ) || exit;

/**
 * Content Gate metadata class.
 */
class Content_Gate extends Contact_Metadata {

	/**
	 * Cached custom access gates for the current request.
	 *
	 * @var array|null
	 */
	private static $custom_access_gates_cache = null;

	/**
	 * Reset the cached custom access gates.
	 */
	public static function reset_cache() {
		self::$custom_access_gates_cache = null;
	}

	/**
	 * Whether or not the metadata fields of this class are available to be synced.
	 *
	 * @return boolean
	 */
	public static function is_available() {
		return true;
	}

	/**
	 * The name of the metadata class, used as a section name for the fields handled by this class when syncing and in the UI for selecting which fields to sync.
	 *
	 * @return string
	 */
	public static function get_section_name() {
		return __( 'Content Access', 'newspack' );
	}

	/**
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return [
			'Content_Access'        => 'Content Access',
			'Content_Access_Source' => 'Content Access Source',
			'Content_Access_Group'  => 'Content Access Group',
		];
	}

	/**
	 * Get the metadata for the given user, customer or order.
	 *
	 * @return array
	 */
	public function get_metadata() {
		if ( ! $this->user ) {
			return [];
		}

		$custom_access_gates = self::get_custom_access_gates();

		// No custom access gates configured — nothing to evaluate.
		if ( empty( $custom_access_gates ) ) {
			return [
				'Content_Access'        => '',
				'Content_Access_Source' => '',
				'Content_Access_Group'  => '',
			];
		}

		$evaluations = [];
		foreach ( $custom_access_gates as $gate ) {
			$evaluations[] = User_Gate_Access::evaluate_gate_for_user( $gate, $this->user->ID );
		}

		$user_id = $this->user->ID;
		return [
			'Content_Access'        => self::has_content_access( $evaluations ) ? 'Yes' : 'No',
			'Content_Access_Source' => implode( ', ', self::collect_labels( $evaluations, $user_id, [ self::class, 'get_source_labels' ] ) ),
			'Content_Access_Group'  => implode( ', ', self::collect_labels( $evaluations, $user_id, [ self::class, 'get_group_labels' ] ) ),
		];
	}

	/**
	 * Get published gates with active custom access, cached for the request.
	 *
	 * @return array
	 */
	private static function get_custom_access_gates() {
		if ( null === self::$custom_access_gates_cache ) {
			$gates                          = Content_Gate_CPT::get_gates( Content_Gate_CPT::GATE_CPT, 'publish' );
			self::$custom_access_gates_cache = array_filter(
				$gates,
				function ( $gate ) {
					return ! is_wp_error( $gate ) && ! empty( $gate['custom_access']['active'] );
				}
			);
		}

		return self::$custom_access_gates_cache;
	}

	/**
	 * Whether any evaluated gate grants the user bypass access.
	 *
	 * @param array $evaluations Results from User_Gate_Access::evaluate_gate_for_user().
	 * @return bool
	 */
	private static function has_content_access( $evaluations ) {
		foreach ( $evaluations as $result ) {
			if ( $result['can_bypass'] ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Walk gate evaluations and collect labels via a per-rule resolver.
	 *
	 * @param array    $evaluations Results from User_Gate_Access::evaluate_gate_for_user().
	 * @param int      $user_id     User ID.
	 * @param callable $resolver    Receives ($slug, $value, $user_id) and returns string[] of labels.
	 * @return array Sorted, deduplicated labels.
	 */
	private static function collect_labels( $evaluations, $user_id, $resolver ) {
		$labels_set = [];

		foreach ( $evaluations as $result ) {
			if ( ! $result['can_bypass'] ) {
				continue;
			}
			foreach ( $result['groups'] as $group ) {
				if ( ! $group['passes'] ) {
					continue;
				}
				foreach ( $group['rules'] as $rule ) {
					if ( ! $rule['passes'] ) {
						continue;
					}
					foreach ( $resolver( $rule['slug'], $rule['value'], $user_id ) as $label ) {
						$labels_set[ $label ] = true;
					}
				}
			}
		}

		$labels = array_keys( $labels_set );
		sort( $labels, SORT_NATURAL | SORT_FLAG_CASE );
		return $labels;
	}

	/**
	 * Map an access rule slug and value to source labels.
	 *
	 * @param string $slug    Rule slug.
	 * @param mixed  $value   Rule value.
	 * @param int    $user_id User ID.
	 * @return array Source labels.
	 */
	private static function get_source_labels( $slug, $value, $user_id ) {
		switch ( $slug ) {
			case 'subscription':
				if ( is_array( $value ) && function_exists( 'wc_get_product' ) ) {
					$names = [];
					foreach ( $value as $product_id ) {
						// Check if the user owns an active subscription for the product (not just a group subscription member).
						if ( Access_Rules::has_active_subscription( $user_id, [ $product_id ], true ) ) {
							$product = wc_get_product( $product_id );
							if ( $product ) {
								$names[] = wp_specialchars_decode( $product->get_name() );
							}
						}
					}
					if ( ! empty( $names ) ) {
						return $names;
					}
					// If they don't have an active subscription, check if they're a member of a group subscription.
					if ( Access_Rules::has_active_subscription( $user_id, $value ) ) {
						return [ 'group' ];
					}
				}
				// If they don't have an active subscription and they're not a group member, they might still have access via the `newspack_access_rules_has_active_subscription` filter hook.
				return [ 'subscription' ];

			case 'email_domain':
				return [ 'domain' ];

			case 'institution':
				return [ 'institution' ];

			default:
				return [];
		}
	}

	/**
	 * Map an access rule slug and value to group labels.
	 *
	 * @param string $slug    Rule slug.
	 * @param mixed  $value   Rule value.
	 * @param int    $user_id User ID.
	 * @return array Group labels.
	 */
	private static function get_group_labels( $slug, $value, $user_id ) {
		switch ( $slug ) {
			case 'subscription':
				// Consider both group subscriptions the user is a member of and those they own.
				$candidates = Group_Subscription::get_group_subscriptions_for_user( $user_id );
				if ( function_exists( 'wcs_get_users_subscriptions' ) ) {
					$candidates = array_merge( $candidates, array_values( wcs_get_users_subscriptions( $user_id ) ) );
				}
				$group_names = [];
				$seen        = [];
				foreach ( $candidates as $subscription ) {
					if ( ! $subscription || ! Group_Subscription::is_group_subscription( $subscription ) ) {
						continue;
					}
					$sub_id = $subscription->get_id();
					if ( isset( $seen[ $sub_id ] ) ) {
						continue;
					}
					if ( ! $subscription->has_status( WooCommerce_Connection::ACTIVE_SUBSCRIPTION_STATUSES ) ) {
						continue;
					}
					foreach ( $value as $product_id ) {
						if ( $subscription->has_product( $product_id ) ) {
							$group_settings  = Group_Subscription_Settings::get_subscription_settings( $subscription );
							$group_names[]   = wp_specialchars_decode( $group_settings['name'] );
							$seen[ $sub_id ] = true;
							break;
						}
					}
				}
				return $group_names;

			case 'institution':
				$institutions      = Institution::get_cached_institutions();
				$institution_names = [];
				foreach ( $value as $institution_id ) {
					if ( isset( $institutions[ $institution_id ] ) && Institution::user_matches_institution( $user_id, $institutions[ $institution_id ] ) ) {
						$institution_names[] = wp_specialchars_decode( get_the_title( $institution_id ) );
					}
				}
				return $institution_names;

			default:
				return [];
		}
	}
}
