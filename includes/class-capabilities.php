<?php
/**
 * Newspack Capabilities.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Capabilities Class.
 */
final class Capabilities {
	/**
	 * Initialize Hooks.
	 */
	public static function init() {
		add_filter( 'user_has_cap', [ __CLASS__, 'map_capabilities' ], 10, 4 );
	}

	/**
	 * Map legacy capabilities to granularly-controlled capabilities.
	 * If a CPT had its capabilities inherrited from the regular post,
	 * this should be maintained so the users don't lose access.
	 *
	 * @param bool[]   $allcaps All caps.
	 * @param string[] $caps    Required primitive capabilities for the requested capability.
	 * @param array    $args    Args for the capability check.
	 * @param WP_User  $user    The user object.
	 */
	public static function map_capabilities( $allcaps, $caps, $args, $user ) {
		$capabilities_map = apply_filters( 'newspack_capabilities_map', [] );
		foreach ( $capabilities_map as $post_type => $old_post_type ) {
			$post_type_object = get_post_type_object( $post_type );
			if ( ! $post_type_object ) {
				continue;
			}
			$post_type_object_old = get_post_type_object( $old_post_type );
			if ( ! $post_type_object_old ) {
				continue;
			}
			foreach ( $caps as $requested_cap ) {
				if ( stripos( $requested_cap, $post_type ) !== false ) {
					$found_old_cap_name = array_search( $requested_cap, (array) $post_type_object->cap, true );
					if ( $found_old_cap_name !== false ) {
						if ( isset( $allcaps[ $found_old_cap_name ] ) && $allcaps[ $found_old_cap_name ] ) {
							$allcaps[ $requested_cap ] = true;
						}
					}
				}
			}
		}
		return $allcaps;
	}
}
Capabilities::init();
