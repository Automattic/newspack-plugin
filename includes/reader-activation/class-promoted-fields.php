<?php
/**
 * Promoted Fields — registers integration-pulled fields as access rules and segmentation criteria.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Access_Rules;
use Newspack\Reader_Data;
use Newspack\Reader_Activation\Integrations\Incoming_Contact_Field;

defined( 'ABSPATH' ) || exit;

/**
 * Promoted Fields class.
 */
class Promoted_Fields {

	/**
	 * Cache for promoted fields.
	 *
	 * @var array|null
	 */
	private static $promoted_fields = null;

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register' ], 15 );
	}

	/**
	 * Register promoted fields as access rules and segmentation criteria.
	 */
	public static function register() {
		$fields = self::get_promoted_fields();
		self::register_access_rules( $fields );
		self::register_segment_criteria( $fields );
	}

	/**
	 * Get all promoted fields from active integrations.
	 *
	 * @return array Promoted fields as [ namespaced_key => [ 'field' => Incoming_Contact_Field, 'integration' => Integration ] ].
	 */
	public static function get_promoted_fields() {
		if ( null !== self::$promoted_fields ) {
			return self::$promoted_fields;
		}

		$fields = [];

		if ( ! class_exists( '\Newspack\Reader_Activation\Integrations' ) ) {
			self::$promoted_fields = $fields;
			return $fields;
		}

		$integrations = Integrations::get_active_integrations();
		if ( ! is_array( $integrations ) ) {
			self::$promoted_fields = $fields;
			return $fields;
		}

		foreach ( $integrations as $integration ) {
			foreach ( $integration->get_enabled_incoming_fields() as $field ) {
				if ( ! $field->is_access_rule() && ! $field->is_segment_criteria() ) {
					continue;
				}
				// Namespace the key with the integration ID to avoid collisions.
				$namespaced_key            = $integration->get_id() . '__' . $field->get_key();
				$fields[ $namespaced_key ] = [
					'field'       => $field,
					'integration' => $integration,
				];
			}
		}

		/**
		 * Filters the promoted fields available as access rules and segmentation criteria.
		 *
		 * @param array $fields Promoted fields keyed by namespaced key.
		 */
		self::$promoted_fields = apply_filters( 'newspack_integration_promoted_fields', $fields );
		return self::$promoted_fields;
	}

	/**
	 * Reset the cached promoted fields. Useful for testing.
	 */
	public static function reset_cache() {
		self::$promoted_fields = null;
	}

	/**
	 * Get the display name for a promoted field, prefixed with the integration name.
	 *
	 * @param Incoming_Contact_Field                  $field       The field.
	 * @param \Newspack\Reader_Activation\Integration $integration The integration.
	 * @return string
	 */
	private static function get_display_name( $field, $integration ) {
		return sprintf( '%s: %s', $integration->get_name(), $field->get_name() );
	}

	/**
	 * Register promoted fields as content gate access rules.
	 *
	 * @param array $fields Promoted fields.
	 */
	private static function register_access_rules( $fields ) {
		foreach ( $fields as $key => $entry ) {
			$field       = $entry['field'];
			$integration = $entry['integration'];

			if ( ! $field->is_access_rule() ) {
				continue;
			}
			Access_Rules::register_rule(
				[
					'id'          => $key,
					'name'        => self::get_display_name( $field, $integration ),
					'description' => $field->get_description(),
					'options'     => $field->get_options(),
					'is_boolean'  => 'boolean' === $field->get_value_type(),
					'callback'    => function ( $user_id, $args ) use ( $field ) {
						return self::evaluate_field( $field, $user_id, $args );
					},
				]
			);
		}
	}

	/**
	 * Register promoted fields as popups segmentation criteria.
	 *
	 * @param array $fields Promoted fields.
	 */
	private static function register_segment_criteria( $fields ) {
		if ( ! class_exists( '\Newspack_Popups_Criteria' ) ) {
			return;
		}
		foreach ( $fields as $key => $entry ) {
			$field       = $entry['field'];
			$integration = $entry['integration'];

			if ( ! $field->is_segment_criteria() ) {
				continue;
			}
			$options = $field->get_options();

			// Boolean fields get Yes/No options for segmentation.
			if ( 'boolean' === $field->get_value_type() && empty( $options ) ) {
				$options = [
					[
						'value' => 'yes',
						'label' => __( 'Yes', 'newspack-plugin' ),
					],
					[
						'value' => 'no',
						'label' => __( 'No', 'newspack-plugin' ),
					],
				];
			}

			// Prepend an empty "Any" option so the criterion can be left unset.
			if ( ! empty( $options ) ) {
				array_unshift(
					$options,
					[
						'value' => '',
						'label' => __( 'Any', 'newspack-plugin' ),
					]
				);
			}

			\Newspack_Popups_Criteria::register_criteria(
				$key,
				[
					'name'               => self::get_display_name( $field, $integration ),
					'category'           => 'integrations',
					'matching_function'  => $field->get_matching_function(),
					'matching_attribute' => $field->get_key(),
					'options'            => $options,
					'description'        => $field->get_description(),
				]
			);
		}
	}

	/**
	 * Evaluate a promoted field for a given user.
	 *
	 * @param Incoming_Contact_Field $field   The field.
	 * @param int                    $user_id User ID.
	 * @param mixed                  $args    Rule arguments (value to match against).
	 *
	 * @return bool Whether the field matches.
	 */
	private static function evaluate_field( $field, $user_id, $args ) {
		$value = Reader_Data::get_data( $user_id, $field->get_key() );

		// Boolean fields: access rules pass no args (just check truthiness),
		// segmentation passes 'yes'/'no'.
		if ( 'boolean' === $field->get_value_type() ) {
			$is_truthy = ! empty( $value );

			// Segmentation: expects 'yes'/'no' (case-insensitive) as string arguments.
			if ( is_string( $args ) ) {
				$normalized = strtolower( $args );
				if ( 'yes' === $normalized ) {
					return $is_truthy;
				}
				if ( 'no' === $normalized ) {
					return ! $is_truthy;
				}
			}

			// Access rule with is_boolean or non-string args: just check truthiness.
			return $is_truthy;
		}

		switch ( $field->get_matching_function() ) {
			case 'range':
				$min = $args['min'] ?? 0;
				$max = $args['max'] ?? PHP_INT_MAX;
				return (float) $value >= (float) $min && (float) $value <= (float) $max;
			case 'list__in':
				$user_values = self::parse_list_value( $value );
				return ! empty( array_intersect( (array) $args, $user_values ) );
			case 'list__not_in':
				$user_values = self::parse_list_value( $value );
				return empty( array_intersect( (array) $args, $user_values ) );
			default:
				return $value === $args;
		}
	}

	/**
	 * Parse a stored value into an array for list matching.
	 *
	 * Handles JSON-encoded arrays, plain scalar strings, and null/empty values.
	 *
	 * @param mixed $value The stored value.
	 * @return array
	 */
	private static function parse_list_value( $value ) {
		if ( is_array( $value ) ) {
			return $value;
		}
		if ( ! is_string( $value ) || '' === $value ) {
			return [];
		}
		$decoded = json_decode( $value, true );
		if ( is_array( $decoded ) ) {
			return $decoded;
		}
		// Plain scalar string — treat as single-element list.
		return [ $value ];
	}
}
Promoted_Fields::init();
