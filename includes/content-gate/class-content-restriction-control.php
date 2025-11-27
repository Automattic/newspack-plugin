<?php
/**
 * Newspack Content Restriction Control
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Access_Rules;

/**
 * Main class.
 */
class Content_Restriction_Control {

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'newspack_is_post_restricted', [ __CLASS__, 'is_post_restricted' ], 10, 2 );
	}

	/**
	 * Get the post types that can be restricted.
	 */
	public static function get_available_post_types() {
		$available_post_types = array_values(
			array_map(
				function( $post_type ) {
					return [
						'value' => $post_type->name,
						'label' => $post_type->label,
					];
				},
				get_post_types(
					[
						'public'       => true,
						'show_in_rest' => true,
						'_builtin'     => false,
					],
					'objects'
				)
			)
		);

		return apply_filters(
			'newspack_content_gate_supported_post_types',
			array_merge(
				[
					[
						'value' => 'post',
						'label' => 'Posts',
					],
					[
						'value' => 'page',
						'label' => 'Pages',
					],
				],
				$available_post_types
			)
		);
	}

	/**
	 * Get the taxonomies that can be restricted.
	 * By default, this includes all public taxonomies that apply to available post types.
	 *
	 * @return array Array of taxonomies.
	 */
	public static function get_available_taxonomies() {
		$available_taxonomies = [
			[
				'slug'  => 'category',
				'label' => 'Categories',
			],
			[
				'slug'  => 'post_tag',
				'label' => 'Tags',
			],
		];

		return apply_filters(
			'newspack_content_gate_supported_taxonomies',
			$available_taxonomies
		);
	}

	/**
	 * Get post gates.
	 *
	 * @param int $post_id Optional post ID.
	 *
	 * @return int[] Array of gate post IDs.
	 */
	public static function get_post_gates( $post_id = null ) {
		$post_id    = $post_id ?? \get_the_ID();
		$post_type  = \get_post_type( $post_id );
		$categories = \wp_get_post_categories( $post_id );
		$tags       = \wp_get_post_tags( $post_id, [ 'fields' => 'ids' ] );

		$gate_post_ids   = [];
		$gates           = Content_Gate::get_gates();

		foreach ( $gates as $gate ) {
			// TODO: Change this to read from the gate rules.
			$gate_post_types = \get_post_meta( $gate['id'], 'post_types', true );
			$gate_categories = \wp_get_post_categories( $gate['id'] );
			$gate_tags       = \wp_get_post_tags( $gate['id'], [ 'fields' => 'ids' ] );

			if ( empty( $gate_post_types ) || ! in_array( $post_type, $gate_post_types, true ) ) {
				continue;
			}
			if ( ! empty( $gate_categories ) && empty( array_intersect( $gate_categories, $categories ) ) ) {
				continue;
			}
			if ( ! empty( $gate_tags ) && empty( array_intersect( $gate_tags, $tags ) ) ) {
				continue;
			}
			$gate_post_ids[] = $gate['id'];
		}

		return $gate_post_ids;
	}

	/**
	 * Whether the post is restricted for the current user.
	 *
	 * @param bool $is_post_restricted Whether the post is restricted for the current user.
	 * @param int  $post_id            Post ID.
	 *
	 * @return bool
	 */
	public static function is_post_restricted( $is_post_restricted, $post_id = null ) {
		// Don't apply our restriction strategy if Woo Memberships is active.
		if ( Memberships::is_active() ) {
			return $is_post_restricted;
		}

		// Return early if the post is already restricted for the current user.
		if ( $is_post_restricted ) {
			return $is_post_restricted;
		}

		$gate_ids = self::get_post_gates( $post_id );
		if ( empty( $gate_ids ) ) {
			return false;
		}

		foreach ( $gate_ids as $gate_id ) {
			$access_rules = Access_Rules::get_post_access_rules( $gate_id );
			if ( empty( $access_rules ) ) {
				continue;
			}
			foreach ( $access_rules as $rule ) {
				if ( ! Access_Rules::evaluate_rule( $rule['slug'], $rule['value'] ?? null ) ) {
					return false;
				}
			}
		}
		return true;
	}
}
Content_Restriction_Control::init();
