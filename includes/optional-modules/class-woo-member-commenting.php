<?php
/**
 * Woo member commenting.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Woo member commenting.
 */
class Woo_Member_Commenting {

	/**
	 * Initialize.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'init', [ __CLASS__, 'on_init' ] );
	}

	/**
	 * Action callback on init.
	 *
	 * @return void
	 */
	public static function on_init() {
		if ( ! self::should_load() ) {
			return;
		}

		add_filter( 'comment_form_defaults', [ __CLASS__, 'filter_comment_form_defaults' ] );
		add_filter( 'comment_form_fields', [ __CLASS__, 'filter_comment_form_fields' ] );
		add_filter( 'comment_form_submit_field', [ __CLASS__, 'filter_comment_form_submit_field' ] );
	}

	/**
	 * Filter callback.
	 *
	 * @param array $defaults The defaults array to filter.
	 *
	 * @return mixed
	 */
	public static function filter_comment_form_defaults( $defaults ) {
		if ( ! self::require_membership_to_comment_for_user() ) {
			return $defaults;
		}

		$defaults['comment_notes_before'] = '';
		$defaults['must_log_in']          = sprintf( '<p class="must-log-in">%s</p>', self::get_membership_required_message() );

		return $defaults;
	}


	/**
	 * Filter callback.
	 *
	 * @param array $fields The fields array to filter.
	 *
	 * @return array The filtered fields array.
	 */
	public static function filter_comment_form_fields( $fields ) {
		return self::require_membership_to_comment_for_user() ? [] : $fields;
	}

	/**
	 *  Filter callback.
	 *
	 * @param string $field Field to filter.
	 *
	 * @return string The filtered field.
	 */
	public static function filter_comment_form_submit_field( $field ) {
		if ( ! self::require_membership_to_comment_for_user() ) {
			return $field;
		}

		return sprintf( '<p class="must-log-in">%s</p>', self::get_membership_required_message() );
	}

	/**
	 * Get the message to display to users that don't have access to commenting.
	 *
	 * @return string The message to display.
	 */
	private static function get_membership_required_message(): string {
		$message = __( 'Only Members may post a comment.', 'newspack-plugin' );
		if ( ! is_user_logged_in() ) {
			$message .= ' ' . __( 'If you already have a membership, then <a href="/my-account/">sign in</a>.', 'newspack-plugin' );
		}
		if ( defined( 'NP_WC_MEMBER_COMMENT_MEMBERSHIP_PURCHASE_SLUG' ) && ! empty( NP_WC_MEMBER_COMMENT_MEMBERSHIP_PURCHASE_SLUG ) ) {
			/* translators: %s - is the slug to buy a membership */
			$message .= ' ' . sprintf( __( '<a href="/%s">Become a member now</a>.', 'newspack-plugin' ), NP_WC_MEMBER_COMMENT_MEMBERSHIP_PURCHASE_SLUG );
		}

		return $message;
	}

	/**
	 * Whether class should suppress commenting for non-members.
	 *
	 * @return bool True if should suppress commenting for non-members, false otherwise.
	 */
	public static function should_load(): bool {
		if ( empty( self::get_plan_slugs() ) ) {
			return false;
		}

		return Settings::is_optional_module_active( 'woo-member-commenting' ) && function_exists( 'wc_memberships_get_user_memberships' ) && ! current_user_can( 'edit_posts' );
	}

	/**
	 * Get slugs for membership plans that should allow commenting.
	 *
	 * This is managed by a constant for now – note that the constant can be a single string or an array of strings.
	 *
	 * @return array Array of plan slugs that allow commenting.
	 */
	private static function get_plan_slugs(): array {
		if ( ! defined( 'NP_WC_MEMBER_COMMENT_PLAN_SLUG' ) || empty( NP_WC_MEMBER_COMMENT_PLAN_SLUG ) ) {
			return [];
		}
		if ( ! is_array( NP_WC_MEMBER_COMMENT_PLAN_SLUG ) ) {
			return [ NP_WC_MEMBER_COMMENT_PLAN_SLUG ];
		}

		return NP_WC_MEMBER_COMMENT_PLAN_SLUG;
	}

	/**
	 * Whether membership is required to comment for the current user.
	 *
	 * @param bool $skip_cache Whether to skip the cache.
	 *
	 * @return bool True if membership is required to comment, false otherwise.
	 */
	public static function require_membership_to_comment_for_user( bool $skip_cache = false ): bool {
		// This gets called a lot – so cache the result.
		static $require_membership_to_comment;
		if ( $skip_cache || null !== $require_membership_to_comment ) {
			return $require_membership_to_comment;
		}

		if ( ! self::should_load() ) {
			$require_membership_to_comment = false;
		} else {
			$memberships_required_plans    = array_filter(
				wc_memberships_get_user_memberships(),
				fn( $membership ) => in_array( $membership->get_plan()->get_slug(), self::get_plan_slugs() )
			);
			$require_membership_to_comment = empty( $memberships_required_plans );
		}

		return $require_membership_to_comment;
	}
}

Woo_Member_Commenting::init();
