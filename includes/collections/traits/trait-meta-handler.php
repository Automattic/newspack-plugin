<?php
/**
 * Meta Handler trait.
 *
 * @package Newspack
 */

namespace Newspack\Collections\Traits;

defined( 'ABSPATH' ) || exit;

/**
 * Trait for handling meta field registration and management.
 */
trait Meta_Handler {

	/**
	 * Meta key prefix.
	 *
	 * @var string
	 */
	public static $prefix = 'newspack_collection_';

	/**
	 * Get meta definitions.
	 *
	 * @return array {
	 *     Array of meta definitions.
	 *
	 *     @type string $type              The type of data associated with this meta key.
	 *     @type string $label             A human-readable label of the data attached to this meta key.
	 *     @type string $description       A description of the data attached to this meta key.
	 *     @type bool   $single            Whether the meta key has one value per object, or an array of values per object.
	 *     @type string $sanitize_callback A function or method to call when sanitizing `$meta_key` data.
	 *     @type array  $show_in_rest      Show in REST configuration.
	 *     @type mixed  $default           Default value for the meta field.
	 * }
	 */
	abstract public static function get_meta_definitions();

	/**
	 * Register meta fields for the specified object type.
	 *
	 * @param string $object_type The object type to register meta for. Accepts 'post' or 'term'.
	 * @param string $object_subtype The object subtype to register meta for.
	 *
	 * @throws \InvalidArgumentException If the object type is invalid.
	 */
	public static function register_meta_for_object( $object_type, $object_subtype ) {
		if ( ! in_array( $object_type, [ 'post', 'term' ], true ) ) {
			throw new \InvalidArgumentException( 'Invalid object type: ' . esc_html( $object_type ) );
		}

		foreach ( static::get_meta_definitions() as $key => $meta ) {
			register_meta(
				$object_type,
				static::$prefix . $key,
				array_merge(
					$meta,
					[
						'object_subtype' => $object_subtype,
						'auth_callback'  => [ static::class, 'auth_callback' ],
					]
				)
			);
		}
	}

	/**
	 * Get meta definitions to be passed to the frontend.
	 *
	 * @return array Meta keys array formatted for frontend consumption.
	 */
	public static function get_frontend_meta_definitions() {
		$metas = static::get_meta_definitions();

		return array_combine(
			array_keys( $metas ),
			array_map(
				fn( $key ) => array_filter(
					[
						'key'     => static::$prefix . $key,
						'type'    => static::get_frontend_type( $metas[ $key ] ),
						'label'   => $metas[ $key ]['label'] ?? null,
						'help'    => $metas[ $key ]['description'] ?? null,
						'default' => $metas[ $key ]['default'] ?? null,
					],
					fn( $value ) => null !== $value
				),
				array_keys( $metas )
			)
		);
	}

	/**
	 * Get a meta value for a post.
	 *
	 * @param int    $post_id The post ID.
	 * @param string $key     The meta key.
	 * @return mixed The meta value.
	 */
	public static function get( $post_id, $key ) {
		return get_post_meta( $post_id, static::$prefix . $key, true );
	}

	/**
	 * Get the frontend type for a meta field.
	 *
	 * @param array $meta_config Meta field configuration.
	 * @return string Frontend type.
	 */
	private static function get_frontend_type( $meta_config ) {
		if ( 'uri' === ( $meta_config['show_in_rest']['schema']['format'] ?? null ) ) {
			return 'url';
		}

		return match ( $meta_config['type'] ) {
			'array', 'boolean', 'integer' => $meta_config['type'],
			default                       => 'text',
		};
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
