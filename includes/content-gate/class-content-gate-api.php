<?php
/**
 * Newspack Content Gate API.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Content Gate API class.
 * Handles all API operations for content gates.
 */
class Content_Gate_API {

	/**
	 * Get gate.
	 *
	 * @param int $id Gate ID.
	 *
	 * @return array|\WP_Error The gate or error if not found.
	 */
	public static function get_gate( $id ) {
		return Content_Gate::get_gate( $id );
	}

	/**
	 * Get all gates.
	 *
	 * @param string          $post_type Post type.
	 * @param string|string[] $post_status Post status or array of statuses to fetch.
	 *
	 * @return array Array of content gates.
	 */
	public static function get_gates( $post_type = null, $post_status = null ) {
		$post_type = $post_type ?? Content_Gate::GATE_CPT;
		return Content_Gate::get_gates( $post_type, $post_status );
	}

	/**
	 * Create a new gate post.
	 *
	 * @param string $title     Optional gate title. Defaults to 'Content Gate'.
	 * @param string $post_type Optional post type. Defaults to self::GATE_CPT.
	 *
	 * @return int|\WP_Error Gate ID or error.
	 */
	public static function create_gate( $title = '', $post_type = null ) {
		$post_type = $post_type ?? Content_Gate::GATE_CPT;
		return Content_Gate::create_gate( $title, $post_type );
	}

	/**
	 * Update single gate setting
	 *
	 * @param int    $id    Gate ID.
	 * @param string $key   Gate setting key.
	 * @param mixed  $value Gate setting value.
	 *
	 * @return array|\WP_Error
	 */
	public static function update_gate_setting( $id, $key, $value ) {
		return Content_Gate::update_gate_setting( $id, $key, $value );
	}

	/**
	 * Update gate settings
	 *
	 * @param int   $id   Gate ID.
	 * @param array $gate Gate settings.
	 *
	 * @return array|\WP_Error
	 */
	public static function update_gate_settings( $id, $gate ) {
		return Content_Gate::update_gate_settings( $id, $gate );
	}

	/**
	 * Delete a gate.
	 *
	 * @param int $id Gate ID.
	 *
	 * @return bool|\WP_Error True on success, error on failure.
	 */
	public static function delete_gate( $id ) {
		$post = get_post( $id );
		if ( ! $post ) {
			return new \WP_Error( 'newspack_content_gate_not_found', __( 'Gate not found.', 'newspack' ) );
		}

		$result = \wp_delete_post( $id, true );
		if ( ! $result ) {
			return new \WP_Error( 'newspack_content_gate_delete_error', __( 'Failed to delete gate.', 'newspack' ) );
		}

		return true;
	}

	/**
	 * Get the content rules.
	 *
	 * @return array The content rules.
	 */
	public static function get_content_rules() {
		return Content_Gate::get_content_rules();
	}

	/**
	 * Get access rules.
	 *
	 * @return array The access rules.
	 */
	public static function get_access_rules() {
		return Access_Rules::get_access_rules();
	}

	/**
	 * Get an array of tier-eligible subscription product options, formatted for select controls.
	 *
	 * @return array Array of subscription product options.
	 *              [
	 *                  'label' => Product Name,
	 *                  'value' => product_id,
	 *              ]
	 */
	public static function get_purchasable_product_options() {
		return Content_Gate::get_purchasable_product_options();
	}

	/**
	 * Get the valid gate post statuses.
	 *
	 * @return array
	 */
	public static function get_post_statuses() {
		return Content_Gate::get_post_statuses();
	}

	/**
	 * Create a new gate layout post.
	 *
	 * @param string $title Optional layout title.
	 *
	 * @return int|\WP_Error Layout ID or error.
	 */
	public static function create_gate_layout( $title = '' ) {
		if ( empty( $title ) ) {
			$title = __( 'Content Gate Layout', 'newspack' );
		}

		$id = \wp_insert_post(
			[
				'post_title'   => $title,
				'post_type'    => Content_Gate::GATE_LAYOUT_CPT,
				'post_status'  => 'draft',
				'post_content' => '<!-- wp:paragraph --><p>' . __( 'This post is only available to members.', 'newspack' ) . '</p><!-- /wp:paragraph -->',
			]
		);

		if ( is_wp_error( $id ) ) {
			return new \WP_Error( 'newspack_content_gate_create_layout_error', $id->get_error_message() );
		}

		return $id;
	}

	/**
	 * Get all gate layouts.
	 *
	 * @param string|string[] $post_status Post status or array of statuses to fetch.
	 *
	 * @return array Array of gate layouts.
	 */
	public static function get_gate_layouts( $post_status = null ) {
		$posts = get_posts(
			[
				'post_type'      => Content_Gate::GATE_LAYOUT_CPT,
				'post_status'    => $post_status ? $post_status : Content_Gate::get_post_statuses(),
				'posts_per_page' => -1,
			]
		);

		return array_map(
			function ( $post ) {
				return [
					'id'     => $post->ID,
					'title'  => $post->post_title,
					'status' => $post->post_status,
				];
			},
			$posts
		);
	}
}
