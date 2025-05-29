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
		add_filter( 'user_has_cap', [ __CLASS__, 'map_capabilities' ], 10, 2 );
		add_filter( 'cme_plugin_capabilities', [ __CLASS__, 'cme_plugin_capabilities' ] );
	}

	/**
	 * Map legacy capabilities to granularly-controlled capabilities.
	 * This allows custom post type capabilities to be mapped from regular post
	 * capabilities. This way, when a custom post type becomes more granularily controlled
	 * with its own caps, users won't need to have their capabilities updated.
	 *
	 * @param bool[]   $allcaps All caps.
	 * @param string[] $caps    Required primitive capabilities for the requested capability.
	 */
	public static function map_capabilities( $allcaps, $caps ) {
		$capabilities_map = apply_filters( 'newspack_capabilities_map', [] );
		foreach ( $capabilities_map as $cap_or_post_type => $base_cap_or_post_type ) {
			$post_type_object = get_post_type_object( $cap_or_post_type );
			$post_type_object_base = get_post_type_object( $base_cap_or_post_type );
			foreach ( $caps as $requested_cap ) {
				if ( stripos( $requested_cap, $cap_or_post_type ) !== false ) {
					if ( $post_type_object && $post_type_object_base ) {
						$base = array_search( $requested_cap, (array) $post_type_object->cap, true );
						$base_cap_or_post_type = $post_type_object_base->cap->$base;
					}
					if (
						$base_cap_or_post_type !== false
						&& isset( $allcaps[ $base_cap_or_post_type ] )
						&& $allcaps[ $base_cap_or_post_type ]
					) {
						$allcaps[ $requested_cap ] = true;
					}
				}
			}
		}
		return $allcaps;
	}

	/**
	 * Filter the capability-manager-enhanced (PublishPress Capabilties) plugin UI.
	 *
	 * @param array $plugin_caps Array of per-plugin caps.
	 */
	public static function cme_plugin_capabilities( $plugin_caps ) {
		$plugin_caps['Newspack'] = apply_filters( 'newspack_capabilities_in_cme_plugin', [] );
		return $plugin_caps;
	}
}
Capabilities::init();
