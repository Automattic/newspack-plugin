<?php
/**
 * AMP plugin configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;
defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of AMP.
 */
class Progressive_WP_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'progressive-wp';

	/**
	 * List of retrievable fields.
	 *
	 * @var array
	 */
	public $fields = [
		'site_icon',
	];

	/**
	 * Configure AMP for Newspack use.
	 *
	 * @return bool || WP_Error Return true if successful, or WP_Error if not.
	 */
	public function configure() {
		return true;
	}

	/**
	 * Retrieve one value
	 *
	 * @param string $field The key of the value.
	 * @var string || WP_Error
	 */
	public function get( $field = '' ) {
		if ( ! in_array( $field, $this->fields ) ) {
			return new WP_Error( 'newspack_field_not_found', 'Field could not be retrieved' );
		}
		$method = sprintf( 'get_%s', $field );
		return $this->{ $method }();
	}

	/**
	 * Retrieve Site Icon
	 *
	 * @var string
	 */
	public function get_site_icon() {
		$site_icon = get_option( 'site_icon' );
		if ( ! $site_icon ) {
			return null;
		}
		$url = wp_get_attachment_image_src( $site_icon );
		return [
			'id'  => $site_icon,
			'url' => $url[0],
		];
	}

	/**
	 * Update Site Icon
	 *
	 * @param string $site_icon The site icon.
	 */
	public function update_site_icon( $site_icon ) {
		if ( ! empty( $site_icon['id'] ) ) {
			update_option( 'site_icon', intval( $site_icon['id'] ) );
		}
	}

}
