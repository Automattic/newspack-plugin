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
		$post_id = $post_id ?? \get_the_ID();
		if ( ! $post_id ) {
			return [];
		}

		$gates = Content_Gate::get_gates();
		if ( empty( $gates ) ) {
			return [];
		}

		$gate_post_ids = [];
		foreach ( $gates as $gate ) {
			$content_rules = $gate['content_rules'];
			if ( empty( $content_rules ) ) {
				continue;
			}

			foreach ( $content_rules as $content_rule ) {
				if ( $content_rule['slug'] === 'post_type' ) {
					$post_type = get_post_type( $post_id );
					if ( ! in_array( $post_type, $content_rule['value'], true ) ) {
						continue 2;
					}
				} else {
					$taxonomy = get_taxonomy( $content_rule['slug'] );
					if ( ! $taxonomy ) {
						continue 2;
					}
					$terms = wp_get_post_terms( $post_id, $content_rule['slug'], [ 'fields' => 'ids' ] );
					if ( ! $terms || is_wp_error( $terms ) ) {
						continue 2;
					}
					if ( empty( array_intersect( $terms, $content_rule['value'] ) ) ) {
						continue 2;
					}
				}
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
