<?php
/**
 * Nicename change class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;


/**
 * This class adds some tweak to allow for a safe change of the nicename of a user.
 *
 * When a nicename changes it will:
 * * Create a redirect from the old nicename to the new one.
 * * Update the author term created by Co-Authors Plus.
 *
 * It will also register a new CLI command for convenience.
 */
class Nicename_Change {

	const OLD_NICENAME_META_KEY = '_np_old_nicename';

	/**
	 * Registers the hooks.
	 */
	public static function init() {
		add_action( 'profile_update', [ __CLASS__, 'profile_update' ], 10, 2 );
		add_action( 'template_redirect', [ __CLASS__, 'old_nicename_redirect' ] );

		// add a cli command to update the nicename.
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			\WP_CLI::add_command( 'newspack nicename-change', [ __CLASS__, 'cli_change_nicename' ] );
		}
	}

	/**
	 * CLI command to change the nicename of a user.
	 *
	 * Usage: wp newspack nicename-change <user_id> <new_nicename>
	 *
	 * @param array $args  The arguments.
	 */
	public static function cli_change_nicename( $args ) {
		if ( empty( $args ) ) {
			\WP_CLI::error( 'Please provide the user ID and the new nicename.' );
		}

		$user_id = (int) $args[0];
		$new_nicename = $args[1];

		$user_data = get_user_by( 'ID', $user_id );

		if ( ! $user_data ) {
			\WP_CLI::error( 'User not found.' );
		}

		$old_nicename = $user_data->user_nicename;

		// Update the nicename.
		wp_update_user(
			[
				'ID'            => $user_id,
				'user_nicename' => $new_nicename,
			]
		);

		\WP_CLI::success( 'Nicename updated.' );
	}

	/**
	 * Nicename update listener.
	 *
	 * @param int    $user_id        The user ID.
	 * @param object $old_user_data  The old user data.
	 */
	public static function profile_update( $user_id, $old_user_data ) {

		$user_data = get_user( $user_id );

		if ( ! $user_data || $old_user_data->user_nicename === $user_data->user_nicename ) {
			return;
		}

		self::handle_old_nicename_meta( $user_id, $old_user_data->user_nicename, $user_data->user_nicename );
		self::update_author_term( $user_id, $old_user_data->user_nicename, $user_data->user_nicename );
	}

	/**
	 * Handles the old nicename meta.
	 *
	 * @param int    $user_id       The user ID.
	 * @param string $old_nicename  The old nicename.
	 * @param string $new_nicename  The new nicename.
	 */
	public static function handle_old_nicename_meta( $user_id, $old_nicename, $new_nicename ) {
		$old_nicename_meta = (array) get_user_meta( $user_id, self::OLD_NICENAME_META_KEY );

		// If we haven't added this old nicename before, add it now.
		if ( ! empty( $old_nicename ) && ! in_array( $old_nicename, $old_nicename_meta, true ) ) {
			add_user_meta( $user_id, self::OLD_NICENAME_META_KEY, $old_nicename );
		}

		// If the new nicename was used previously, delete it from the list.
		if ( in_array( $new_nicename, $old_nicename_meta, true ) ) {
			delete_user_meta( $user_id, self::OLD_NICENAME_META_KEY, $new_nicename );
		}
	}

	/**
	 * Updates the author term created by Co-Authors Plus.
	 *
	 * @param int    $user_id       The user ID.
	 * @param string $old_nicename  The old nicename.
	 * @param string $new_nicename  The new nicename.
	 */
	public static function update_author_term( $user_id, $old_nicename, $new_nicename ) {
		$term = get_term_by( 'slug', 'cap-' . $old_nicename, 'author' );
		if ( ! $term ) {
			$term = get_term_by( 'slug', $old_nicename, 'author' );
		}

		if ( ! $term ) {
			return;
		}

		wp_update_term(
			$term->term_id,
			'author',
			[
				'slug' => 'cap-' . $new_nicename,
			]
		);
	}

	/**
	 * Redirect old nicenames to the correct permalink.
	 *
	 * Attempts to find the current nicename from the past nicenames.
	 */
	public static function old_nicename_redirect() {

		if ( is_404() && '' !== get_query_var( 'author_name' ) ) {

			global $wpdb;

			$new_user_id = $wpdb->get_var( // phpcs:ignore
				$wpdb->prepare(
					"SELECT user_id FROM $wpdb->usermeta WHERE meta_key = %s AND meta_value = %s LIMIT 1",
					self::OLD_NICENAME_META_KEY,
					get_query_var( 'author_name' )
				)
			);

			if ( empty( $new_user_id ) ) {
				return;
			}

			$link = get_author_posts_url( $new_user_id );

			if ( ! $link ) {
				return;
			}

			wp_safe_redirect( $link, 301 ); // Permanent redirect.
			exit;
		}
	}
}

Nicename_Change::init();
