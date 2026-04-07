<?php
/**
 * Newspack Block Access Control.
 *
 * Per-block visibility control based on content restriction rules.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Block_Visibility class.
 */
class Block_Visibility {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'render_block', [ __CLASS__, 'filter_render_block' ], 10, 2 );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );
		add_filter( 'register_block_type_args', [ __CLASS__, 'register_block_type_args' ], 10, 2 );
	}

	/**
	 * Filter rendered block output based on access control attributes.
	 *
	 * @param string $block_content Rendered block HTML.
	 * @param array  $block         Block data.
	 * @return string
	 */
	public static function filter_render_block( $block_content, $block ) {
		$target_blocks = [ 'core/group', 'core/stack', 'core/row' ];
		if ( ! in_array( $block['blockName'] ?? '', $target_blocks, true ) ) {
			return $block_content;
		}

		if ( is_admin() ) {
			return $block_content;
		}

		$rules = $block['attrs']['newspackAccessControlRules'] ?? [];

		$has_registration = ! empty( $rules['registration']['active'] );
		$has_access_rules = ! empty( $rules['custom_access']['active'] )
							&& ! empty( $rules['custom_access']['access_rules'] );

		if ( ! $has_registration && ! $has_access_rules ) {
			return $block_content;
		}

		// Full evaluation handled in Task 5.
		return $block_content;
	}

	/**
	 * Register block attributes server-side for the three target block types.
	 *
	 * @param array  $args       Block type arguments.
	 * @param string $block_type Block type name.
	 * @return array
	 */
	public static function register_block_type_args( $args, $block_type ) {
		return $args;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		// No-op until implemented.
	}

	/**
	 * Per-request cache: keyed by "{user_id}:{md5(rules)}".
	 *
	 * @var bool[]
	 */
	private static $rules_match_cache = [];

	/**
	 * Reset the per-request cache. Used in unit tests only.
	 */
	public static function reset_cache_for_tests() {
		self::$rules_match_cache = [];
	}

	/**
	 * Public wrapper for tests. Calls evaluate_rules_for_user().
	 *
	 * @param array $rules   Rules array.
	 * @param int   $user_id User ID.
	 * @return bool
	 */
	public static function evaluate_rules_for_user_public( $rules, $user_id ) {
		return self::evaluate_rules_for_user( $rules, $user_id );
	}

	/**
	 * Evaluate whether a user matches the block's access rules.
	 *
	 * @param array $rules   Parsed newspackAccessControlRules attribute.
	 * @param int   $user_id User ID (0 for logged-out).
	 * @return bool True if user matches (should be treated as "matching reader").
	 */
	private static function evaluate_rules_for_user( $rules, $user_id ) {
		$cache_key = $user_id . ':' . md5( wp_json_encode( $rules ) );
		if ( isset( self::$rules_match_cache[ $cache_key ] ) ) {
			return self::$rules_match_cache[ $cache_key ];
		}

		$result = self::compute_rules_match( $rules, $user_id );
		self::$rules_match_cache[ $cache_key ] = $result;
		return $result;
	}

	/**
	 * Compute whether a user matches the block's access rules (uncached).
	 *
	 * @param array $rules   Parsed newspackAccessControlRules attribute.
	 * @param int   $user_id User ID (0 for logged-out).
	 * @return bool
	 */
	private static function compute_rules_match( $rules, $user_id ) {
		$registration  = $rules['registration'] ?? [];
		$custom_access = $rules['custom_access'] ?? [];

		$registration_passes = true;
		if ( ! empty( $registration['active'] ) ) {
			if ( ! $user_id ) {
				$registration_passes = false;
			} elseif ( ! empty( $registration['require_verification'] ) ) {
				$registration_passes = (bool) get_user_meta( $user_id, Reader_Activation::EMAIL_VERIFIED, true );
			}
		}

		$access_passes = true;
		if ( ! empty( $custom_access['active'] ) && ! empty( $custom_access['access_rules'] ) ) {
			$access_passes = Access_Rules::evaluate_rules( $custom_access['access_rules'], $user_id );
		}

		// AND logic: both must pass when both are configured.
		return $registration_passes && $access_passes;
	}
}
Block_Visibility::init();
