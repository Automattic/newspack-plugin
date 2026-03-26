<?php
/**
 * Promoted Fields — registers integration-pulled fields as access rules and segmentation criteria.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Access_Rules;
use Newspack\Reader_Data;

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
	 * Iterates each active integration's enabled incoming fields and calls
	 * get_incoming_field_config() for each. Fields that return a non-empty
	 * config with is_access_rule or is_segment_criteria are collected.
	 *
	 * @return array Promoted fields keyed by field key.
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
			$incoming = $integration->get_enabled_incoming_fields();
			if ( ! is_array( $incoming ) ) {
				continue;
			}
			foreach ( $incoming as $field_key ) {
				if ( ! is_string( $field_key ) || empty( $field_key ) ) {
					continue;
				}
				$config = $integration->get_incoming_field_config( $field_key );
				if ( empty( $config ) ) {
					continue;
				}
				if ( empty( $config['is_access_rule'] ) && empty( $config['is_segment_criteria'] ) ) {
					continue;
				}
				// Ensure defaults.
				$config = wp_parse_args(
					$config,
					[
						'name'              => $field_key,
						'matching_function' => 'default',
						'reader_data_key'   => $field_key,
					]
				);

				// Prefix the display name with the integration name.
				$config['name'] = sprintf( '%s: %s', $integration->get_name(), $config['name'] );

				// Namespace the key with the integration ID to avoid collisions.
				$namespaced_key            = $integration->get_id() . '__' . $field_key;
				$fields[ $namespaced_key ] = $config;
			}
		}

		/**
		 * Filters the promoted fields available as access rules and segmentation criteria.
		 *
		 * @param array $fields Promoted fields keyed by field key.
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
	 * Register promoted fields as content gate access rules.
	 *
	 * @param array $fields Promoted fields.
	 */
	private static function register_access_rules( $fields ) {
		foreach ( $fields as $key => $config ) {
			if ( empty( $config['is_access_rule'] ) ) {
				continue;
			}
			$is_boolean = 'boolean' === ( $config['value_type'] ?? '' );
			Access_Rules::register_rule(
				[
					'id'          => $key,
					'name'        => $config['name'],
					'description' => $config['description'] ?? '',
					'options'     => $config['options'] ?? [],
					'is_boolean'  => $is_boolean,
					'callback'    => function ( $user_id, $args ) use ( $key, $config ) {
						return self::evaluate_field( $key, $config, $user_id, $args );
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
		foreach ( $fields as $key => $config ) {
			if ( empty( $config['is_segment_criteria'] ) ) {
				continue;
			}
			$reader_data_key = $config['reader_data_key'] ?? $key;
			$is_boolean      = 'boolean' === ( $config['value_type'] ?? '' );
			$options          = $config['options'] ?? [];

			// Boolean fields get Yes/No options for segmentation.
			if ( $is_boolean && empty( $options ) ) {
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
					'name'               => $config['name'],
					'category'           => 'integrations',
					'matching_function'  => $config['matching_function'] ?? 'default',
					'matching_attribute' => $reader_data_key,
					'options'            => $options,
					'description'        => $config['description'] ?? '',
				]
			);
		}
	}

	/**
	 * Evaluate a promoted field for a given user.
	 *
	 * @param string $key     Field key.
	 * @param array  $config  Field configuration.
	 * @param int    $user_id User ID.
	 * @param mixed  $args    Rule arguments (value to match against).
	 *
	 * @return bool Whether the field matches.
	 */
	private static function evaluate_field( $key, $config, $user_id, $args ) {
		$reader_data_key = $config['reader_data_key'] ?? $key;
		$match           = $config['matching_function'] ?? 'default';
		$value_type      = $config['value_type'] ?? '';
		$value           = Reader_Data::get_data( $user_id, $reader_data_key );

		// Boolean fields: access rules pass no args (just check truthiness),
		// segmentation passes 'yes'/'no'.
		if ( 'boolean' === $value_type ) {
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

		switch ( $match ) {
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
