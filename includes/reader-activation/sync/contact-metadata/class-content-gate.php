<?php
/**
 * Content Gate contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;
use Newspack\Content_Gate as Content_Gate_CPT;
use Newspack\User_Gate_Access;

defined( 'ABSPATH' ) || exit;

/**
 * Content Gate metadata class.
 */
class Content_Gate extends Contact_Metadata {

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

		$gates = Content_Gate_CPT::get_gates( Content_Gate_CPT::GATE_CPT, 'publish' );
		$custom_access_gates = array_filter(
			$gates,
			function ( $gate ) {
				return ! is_wp_error( $gate ) && ! empty( $gate['custom_access']['active'] );
			}
		);

		// No custom access gates configured — user is not restricted.
		if ( empty( $custom_access_gates ) ) {
			return [
				'Content_Access'        => 'Yes',
				'Content_Access_Source' => '',
			];
		}

		$sources = $this->get_access_sources( $custom_access_gates );

		return [
			'Content_Access'        => ! empty( $sources ) ? 'Yes' : 'No',
			'Content_Access_Source' => ! empty( $sources ) ? implode( ', ', $sources ) : '',
		];
	}

	/**
	 * Get the access source labels for the current user across all custom access gates.
	 *
	 * @param array $gates Gates with active custom access.
	 * @return array Deduplicated source label strings.
	 */
	private function get_access_sources( $gates ) {
		$sources = [];

		foreach ( $gates as $gate ) {
			$result = User_Gate_Access::evaluate_gate_for_user( $gate, $this->user->ID );

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
					$source = self::get_source_label( $rule['slug'], $rule['value'] );
					if ( ! empty( $source ) ) {
						$sources[ $source ] = true;
					}
				}
			}
		}

		return array_keys( $sources );
	}

	/**
	 * Map an access rule slug and value to a human-readable source label.
	 *
	 * @param string $slug  Rule slug.
	 * @param mixed  $value Rule value.
	 * @return string Source label or empty string.
	 */
	private static function get_source_label( $slug, $value ) {
		switch ( $slug ) {
			case 'subscription':
				if ( is_array( $value ) && function_exists( 'wc_get_product' ) ) {
					$names = [];
					foreach ( $value as $product_id ) {
						$product = wc_get_product( $product_id );
						if ( $product ) {
							$names[] = $product->get_name();
						}
					}
					if ( ! empty( $names ) ) {
						return implode( ', ', $names );
					}
				}
				return 'Subscription';

			case 'email_domain':
				return 'domain';

			case 'institution':
				return 'group';

			default:
				return '';
		}
	}
}
