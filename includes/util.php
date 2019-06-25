<?php
/**
 * Useful functions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Clean variables using sanitize_text_field. Arrays are cleaned recursively.
 * Non-scalar values are ignored.
 *
 * @param string|array $var Data to sanitize.
 * @return string|array
 */
function newspack_clean( $var ) {
	if ( is_array( $var ) ) {
		return array_map( 'newspack_clean', $var );
	} else {
		return is_scalar( $var ) ? sanitize_text_field( $var ) : $var;
	}
}

/**
 * Converts a string (e.g. 'yes' or 'no') to a bool.
 *
 * @param string $string String to convert.
 * @return bool
 */
function newspack_string_to_bool( $string ) {
	return is_bool( $string ) ? $string : ( 'yes' === $string || 1 === $string || 'true' === $string || '1' === $string );
}

/**
 * Activate the Newspack theme (installing it if necessary).
 *
 * @return bool | WP_Error True on success. WP_Error on failure.
 */
function newspack_install_activate_theme() {
	$theme_slug = 'newspack-theme';
	$theme_url  = 'https://github.com/Automattic/newspack-theme/archive/master.zip';

	$theme_object = wp_get_theme( $theme_slug );
	if ( ! $theme_object->exists() ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		include_once ABSPATH . 'wp-admin/includes/theme.php';
		WP_Filesystem();

		$skin     = new \Automatic_Upgrader_Skin();
		$upgrader = new \Theme_Upgrader( $skin );
		$success  = $upgrader->install( $theme_url );

		if ( is_wp_error( $success ) ) {
			return $success;
		} else if ( $success ) {
			// Make sure `-master` or `-1.0.1` etc. are not in the theme folder name.
			// We just want the folder name to be the theme slug.
			$theme_object    = $upgrader->theme_info();
			$theme_folder    = $theme_object->get_template_directory();
			$expected_folder = $theme_object->get_theme_root() . '/' . $theme_slug;
			if ( $theme_folder !== $expected_folder ) {
				rename( $theme_folder, $expected_folder );
			}
		} else {
			return new \WP_Error(
				'newspack_theme_failed_install',
				__( 'Newspack theme installation failed.', 'newspack' )
			);
		}
	}

	switch_theme( $theme_slug );
	return true;
}
