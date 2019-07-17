<?php
/**
 * Site Kit plugin configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of Google Site Kit.
 */
class Newspack_GAM_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'newspack-gam';

	/**
	 * Get whether the Site Kit plugin is active and set up.
	 *
	 * @return bool Whether Newspack Google Ad Manager is installed and activated.
	 */
	public function is_configured() {
		return class_exists( 'Newspack_GAM_Model' );
	}

	/**
	 * Get the ad units from our saved option.
	 *
	 * @return array | WP_Error Array of ad units or WP_Error if Newspack Google Ad Manager isn't installed and activated.
	 */
	public function get_ad_units() {
		return $this->is_configured() ?
			\Newspack_GAM_Model::get_ad_units() :
			$this->unconfigured_error();
	}

	/**
	 * Get a single ad unit.
	 *
	 * @param number $id The id of the ad unit to retrieve.
	 * @return array | WP_Error Returns ad unit or error if the plugin is not active or the ad unit doesn't exist.
	 */
	public function get_ad_unit( $id ) {
		return $this->is_configured() ?
			\Newspack_GAM_Model::get_ad_unit( $id ) :
			$this->unconfigured_error();
	}

	/**
	 * Add a new ad unit.
	 *
	 * @param array $ad_unit The new ad unit info to add.
	 * @return array | WP_Error Returns new ad unit or error if the plugin is not active or the ad unit exists already.
	 */
	public function add_ad_unit( $ad_unit ) {
		return $this->is_configured() ?
			\Newspack_GAM_Model::add_ad_unit( $ad_unit ) :
			$this->unconfigured_error();
	}

	/**
	 * Update an ad unit
	 *
	 * @param array $ad_unit The updated ad unit.
	 * @return array | WP_Error Returns updated ad unit or error if the plugin is not active or the ad unit doesn't exist.
	 */
	public function update_ad_unit( $ad_unit ) {
		return $this->is_configured() ?
			\Newspack_GAM_Model::update_ad_unit( $ad_unit ) :
			$this->unconfigured_error();
	}

	/**
	 * Delete an ad unit
	 *
	 * @param integer $id The id of the ad unit to delete.
	 * @return bool | WP_Error Returns true if deletion is successful, of error if the plugin is not active or the ad unit doesn't exist.
	 */
	public function delete_ad_unit( $id ) {
		return $this->is_configured() ?
			\Newspack_GAM_Model::delete_ad_unit( $id ) :
			$this->unconfigured_error();
	}

	/**
	 * Error to return if the plugin is not installed and activated.
	 *
	 * @return WP_Error
	 */
	private function unconfigured_error() {
		return new \WP_Error(
			'newspack_missing_required_plugin',
			esc_html__( 'The Newspack Google Ad Manager plugin is not installed and activated. Install and/or activate it to access this feature.', 'newspack' ),
			[
				'status' => 400,
				'level'  => 'fatal',
			]
		);
	}

	/**
	 * Configure Site Kit for Newspack use.
	 * This can't actually do anything, since Site Kit is partially set up in Google.
	 *
	 * @return bool || WP_Error Return true if successful, or WP_Error if not.
	 */
	public function configure() {
		return true;
	}
}
