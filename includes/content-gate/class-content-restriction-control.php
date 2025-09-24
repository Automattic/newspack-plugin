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
	 * Whether the post is restricted for the current user.
	 *
	 * @param int|bool $is_post_restricted If restricted, the gate post ID. False if not restricted.
	 * @param int      $post_id            Post ID.
	 * @param int|null $user_id            User ID. If not given, checks the current user.
	 *
	 * @return bool
	 */
	public static function is_post_restricted( $is_post_restricted, $post_id = null, $user_id = null ) {
		$user_id = $user_id ?? \get_current_user_id();

		// Don't apply our restriction strategy if Woo Memberships is active.
		if ( Memberships::is_active() ) {
			return $is_post_restricted;
		}

		// Return early if the post is already restricted for the current user.
		if ( $is_post_restricted ) {
			return $is_post_restricted;
		}

		$potential_gate_ids = Content_Gate::get_potential_gates( $post_id );
		if ( empty( $potential_gate_ids ) ) {
			return false;
		}

		foreach ( $potential_gate_ids as $gate_id ) {
			$can_bypass   = false;
			$access_rules = Access_Rules::get_access_rules_for_post( $gate_id );
			if ( empty( $access_rules ) ) {
				continue;
			}
			foreach ( $access_rules as $access_rule ) {
				if ( Access_Rules::evaluate_access_rule( $access_rule['slug'], $access_rule['value'] ?? null, $user_id ) ) {
					$can_bypass = true;
					break;
				}
			}
			if ( ! $can_bypass ) {
				return $gate_id;
			}
		}

		return false;
	}
}
Content_Restriction_Control::init();
