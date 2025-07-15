<?php
/**
 * Collection Meta Fields handler.
 *
 * @package Newspack
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the Collection meta fields and related operations.
 */
class Collection_Meta {

	/**
	 * Meta key prefix.
	 *
	 * @var string
	 */
	public const PREFIX = 'newspack_collection_';

	/**
	 * Get meta keys.
	 *
	 * @return array {
	 *     Array of post meta definitions.
	 *
	 *     @type string $type              The type of data associated with this meta key.
	 *     @type string $label             A human-readable label of the data attached to this meta key.
	 *     @type string $description       A description of the data attached to this meta key.
	 *     @type bool   $single            Whether the meta key has one value per object, or an array of values per object.
	 *     @type string $sanitize_callback A function or method to call when sanitizing `$meta_key` data.
	 *     @type array  $show_in_rest      Show in REST configuration.
	 * }
	 */
	public static function get_metas() {
		return [
			'volume'         => [
				'type'              => 'string',
				'label'             => __( 'Volume', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
			],
			'number'         => [
				'type'              => 'string',
				'label'             => __( 'Number', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
			],
			'period'         => [
				'type'              => 'string',
				'label'             => __( 'Period', 'newspack-plugin' ),
				'description'       => __( 'Period as a string (e.g., "Spring 2025", "January 2025")', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
			],
			'subscribe_link' => [
				'type'              => 'string',
				'label'             => __( 'Subscription URL', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => [
					'schema' => [
						'format' => 'uri',
					],
				],
			],
			'order_link'     => [
				'type'              => 'string',
				'label'             => __( 'Order URL', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => [
					'schema' => [
						'format' => 'uri',
					],
				],
			],
			'ctas'           => [
				'type'              => 'array',
				'label'             => __( 'Call-to-Action', 'newspack-plugin' ),
				'description'       => __( 'Add multiple CTAs linking to attachments or external URLs.', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => [ __CLASS__, 'sanitize_ctas' ],
				'show_in_rest'      => [
					'schema' => [
						'type'  => 'array',
						'items' => [
							'type'       => 'object',
							'properties' => [
								'type'  => [
									'type' => 'string',
									'enum' => [ 'attachment', 'link' ],
								],
								'label' => [
									'type' => 'string',
								],
								'id'    => [
									'type' => 'integer',
								],
								'url'   => [
									'type'   => 'string',
									'format' => 'uri',
								],
							],
						],
					],
				],
			],
		];
	}

	/**
	 * Get meta definitions to be passed to the frontend.
	 *
	 * @return array Meta keys array.
	 */
	public static function get_frontend_meta_definitions() {
		$metas = self::get_metas();

		return array_combine(
			array_keys( $metas ),
			array_map(
				fn( $key ) => [
					'key'   => self::PREFIX . $key,
					'type'  => 'array' === $metas[ $key ]['type'] ? 'array' : ( 'uri' === ( $metas[ $key ]['show_in_rest']['schema']['format'] ?? null ) ? 'url' : 'text' ),
					'label' => $metas[ $key ]['label'] ?? null,
					'help'  => $metas[ $key ]['description'] ?? null,
				],
				array_keys( $metas )
			)
		);
	}

	/**
	 * Initialize the meta fields handler.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
	}

	/**
	 * Register meta fields for the collection post type.
	 */
	public static function register_meta() {
		foreach ( self::get_metas() as $key => $meta ) {
			register_post_meta(
				Post_Type::get_post_type(),
				self::PREFIX . $key,
				array_merge(
					$meta,
					[
						'auth_callback' => [ __CLASS__, 'auth_callback' ],
					]
				)
			);
		}
	}

	/**
	 * Sanitize CTAs array.
	 *
	 * @param mixed $value Array of CTA objects.
	 * @return array Sanitized array of CTA objects.
	 */
	public static function sanitize_ctas( $value ) {
		if ( ! is_array( $value ) ) {
			return [];
		}

		return array_filter(
			array_map( [ self::class, 'sanitize_single_cta' ], $value )
		);
	}

	/**
	 * Sanitize a single CTA object.
	 *
	 * @param mixed $cta CTA object to sanitize.
	 * @return array|null Sanitized CTA or null if invalid.
	 */
	private static function sanitize_single_cta( $cta ) {
		// Validate basic structure.
		if ( ! is_array( $cta ) || ! isset( $cta['type'], $cta['label'] ) ) {
			return null;
		}

		$type  = sanitize_text_field( $cta['type'] );
		$label = sanitize_text_field( $cta['label'] );

		// Validate type and label.
		if ( ! in_array( $type, [ 'attachment', 'link' ], true ) || empty( $label ) ) {
			return null;
		}

		$sanitized_cta = [
			'type'  => $type,
			'label' => $label,
		];

		// Type-specific validation and sanitization.
		if ( 'attachment' === $type ) {
			// Check if the attachment ID is a number and if the post type is attachment.
			if ( ! isset( $cta['id'] ) || ! is_numeric( $cta['id'] ) || 'attachment' !== get_post_type( $cta['id'] ) ) {
				return null;
			}
			$sanitized_cta['id'] = absint( $cta['id'] );
		} else {
			if ( ! isset( $cta['url'] ) || empty( $cta['url'] ) ) {
				return null;
			}
			$url = esc_url_raw( $cta['url'] );
			if ( ! $url ) {
				return null;
			}
			$sanitized_cta['url'] = $url;
		}

		return $sanitized_cta;
	}

	/**
	 * Auth callback for meta fields.
	 *
	 * @return bool Whether the user can edit posts.
	 */
	public static function auth_callback() {
		return current_user_can( 'edit_posts' );
	}
}
