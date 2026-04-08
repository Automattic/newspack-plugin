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
		/**
		 * Filters the list of blocks that can be configured for access control visibility.
		 *
		 * @param array $target_blocks List of block names.
		 * @return array
		 */
		$target_blocks = apply_filters( 'newspack_content_gate_block_visibility_blocks', [ 'core/group', 'core/stack', 'core/row' ] );
		if ( ! in_array( $block['blockName'] ?? '', $target_blocks, true ) ) {
			return $block_content;
		}

		// Bypass access control in admin screens and REST requests (block renderer,
		// preview, query-loop rendering inside the editor) so blocks are never hidden
		// from editors during content authoring.
		if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return $block_content;
		}

		$rules = $block['attrs']['newspackAccessControlRules'] ?? [];

		// Defensive cast: the block parser can occasionally yield a stdClass for
		// object-typed attributes (e.g. after JSON round-trips).
		if ( is_object( $rules ) ) {
			$rules = (array) $rules;
		} elseif ( ! is_array( $rules ) ) {
			$rules = [];
		}

		$has_registration = ! empty( $rules['registration']['active'] );
		$has_access_rules = ! empty( $rules['custom_access']['active'] )
							&& ! empty( $rules['custom_access']['access_rules'] );

		if ( ! $has_registration && ! $has_access_rules ) {
			return $block_content;
		}

		// Don't restrict content for users who can edit the post it's in.
		$post_id = get_the_ID();
		$user_id = get_current_user_id();
		if ( ! empty( $post_id ) && user_can( $user_id, 'edit_post', $post_id ) ) {
			return $block_content;
		}

		$visibility   = $block['attrs']['newspackAccessControlVisibility'] ?? 'visible';
		$user_matches = self::evaluate_rules_for_user( $rules, $user_id );

		if ( 'visible' === $visibility ) {
			return $user_matches ? $block_content : '';
		}
		// 'hidden'
		return $user_matches ? '' : $block_content;
	}

	/**
	 * Register block attributes server-side for the three target block types.
	 *
	 * @param array  $args       Block type arguments.
	 * @param string $block_type Block type name.
	 * @return array
	 */
	public static function register_block_type_args( $args, $block_type ) {
		$target_blocks = [ 'core/group', 'core/stack', 'core/row' ];
		if ( ! in_array( $block_type, $target_blocks, true ) ) {
			return $args;
		}

		$args['attributes'] = array_merge(
			$args['attributes'] ?? [],
			[
				'newspackAccessControlVisibility' => [
					'type'    => 'string',
					'default' => 'visible',
				],
				'newspackAccessControlRules'      => [
					'type'    => 'object',
					'default' => [],
				],
			]
		);
		return $args;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		if ( ! current_user_can( 'edit_others_posts' ) ) {
			return;
		}

		$available_post_types = array_column(
			Content_Restriction_Control::get_available_post_types(),
			'value'
		);
		// get_post_type() returns false in the Site Editor / widget screens where
		// no post is in context — in_array( false, [...], true ) is false, so the
		// asset is correctly suppressed. This mirrors the guard in Content_Gate.
		if ( ! in_array( get_post_type(), $available_post_types, true ) ) {
			return;
		}

		$asset_file = dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/content-gate-block-visibility.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;

		wp_enqueue_script(
			'newspack-content-gate-block-visibility',
			Newspack::plugin_url() . '/dist/content-gate-block-visibility.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_localize_script(
			'newspack-content-gate-block-visibility',
			'newspackBlockVisibility',
			[
				'available_access_rules' => array_map(
					function( $rule ) {
						unset( $rule['callback'] );
						return $rule;
					},
					Access_Rules::get_access_rules()
				),
			]
		);
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
