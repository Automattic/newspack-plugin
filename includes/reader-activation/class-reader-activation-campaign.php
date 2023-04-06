<?php
/**
 * Reader Activation default prompts + segments config.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Activation default prompts + segments.
 */
class Reader_Activation_Campaign {
	const OPTION_NAME = 'newspack_ras_prompts';

	/**
	 * Get default prompt + segment config from the Campaigns plugin.
	 *
	 * @return array Default prompt + segment config.
	 */
	private static function get_defaults() {
		$newspack_popups = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );

		return $newspack_popups->get_ras_defaults();
	}

	/**
	 * Get subscribable lists from the Newspack Newsletters plugin.
	 *
	 * @return array Array of lists.
	 */
	private static function get_newsletter_lists() {
		// TODO: There's a race condition here.
		$lists = array_reduce(
			method_exists( '\Newspack_Newsletters_Subscription', 'get_lists' ) ? \Newspack_Newsletters_Subscription::get_lists() : [],
			function( $acc, $list ) {
				if ( ! empty( $list['active'] ) ) {
					$acc[] = [
						'id'          => $list['id'] ?? 0,
						'label'       => $list['title'] ?? '',
						'description' => $list['description'] ?? '',
						'checked'     => false,
					];
				}

				return $acc;
			},
			[]
		);

		return $lists;
	}

	/**
	 * Get the default prompt configs.
	 * Get only the keys needed by the Reader Activation wizard, and append UI-specific info.
	 *
	 * @return array Array of default prompt configs.
	 */
	private static function get_default_prompt_config() {
		$lists           = self::get_newsletter_lists();
		$defaults        = self::get_defaults();
		$default_prompts = array_map(
			function( $prompt ) use ( $lists ) {
				$config = [
					'slug'              => $prompt['slug'],
					'title'             => $prompt['title'],
					'user_input_fields' => $prompt['user_input_fields'],
					'featured_image_id' => null,
					'ready'             => false,
				];

				// Append newsletter list IDs as a field.
				if ( is_int( strpos( $prompt['slug'], '_registration_' ) ) || is_int( strpos( $prompt['slug'], '_newsletter_' ) ) ) {
					$config['user_input_fields'][] = [
						'name'     => 'list_ids',
						'type'     => 'array',
						'label'    => __( 'Select Newsletters', 'newspack' ),
						'required' => true,
						'default'  => [],
						'options'  => $lists,
					];
				}

				return $config;
			},
			$defaults['prompts']
		);

		return $default_prompts;
	}

	/**
	 * Get saved prompt configs, or defaults.
	 *
	 * @return array Array of prompt configs.
	 */
	public static function get_prompts() {
		$default_prompts = self::get_default_prompt_config();
		$saved_inputs    = \get_option( self::OPTION_NAME, $default_prompts );

		return $saved_inputs;
	}
}
