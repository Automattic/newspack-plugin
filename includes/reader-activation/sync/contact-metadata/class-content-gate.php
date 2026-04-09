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
use Newspack\User_Gate_Access;

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
			];
		}

		$evaluations = [];
		foreach ( $custom_access_gates as $gate ) {
			$evaluations[] = User_Gate_Access::evaluate_gate_for_user( $gate, $this->user->ID );
		}

		return [
			'Content_Access'        => self::has_content_access( $evaluations ) ? 'Yes' : 'No',
			'Content_Access_Source' => implode( ', ', self::get_access_source_labels( $evaluations, $this->user->ID ) ),
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
	 * Get deduplicated, sorted source labels from gate evaluations.
	 *
	 * @param array $evaluations Results from User_Gate_Access::evaluate_gate_for_user().
	 * @param int   $user_id     User ID.
	 * @return array Sorted source label strings.
	 */
	private static function get_access_source_labels( $evaluations, $user_id ) {
		$sources = [];

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
					foreach ( self::get_source_labels( $rule['slug'], $rule['value'], $user_id ) as $label ) {
						$sources[ $label ] = true;
					}
				}
			}
		}

		$labels = array_keys( $sources );
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
						if ( Access_Rules::has_active_subscription( $user_id, [ $product_id ] ) ) {
							$product = wc_get_product( $product_id );
							if ( $product ) {
								$names[] = $product->get_name();
							}
						}
					}
					if ( ! empty( $names ) ) {
						return $names;
					}
				}
				return [ 'Subscription' ];

			case 'email_domain':
				return [ 'domain' ];

			case 'institution':
				return [ 'group' ];

			default:
				return [];
		}
	}
}
