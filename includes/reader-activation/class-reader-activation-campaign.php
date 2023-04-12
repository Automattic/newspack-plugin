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
	/**
	 * Get default prompt + segment config from the Campaigns plugin.
	 *
	 * @return array Default prompt + segment config.
	 */
	private static function get_presets() {
		$newspack_popups = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );
		$default_config  = $newspack_popups->get_ras_presets();

		return $default_config;
	}

	/**
	 * Get saved prompt configs, or defaults.
	 *
	 * @return array|WP_Error Array of prompt configs.
	 */
	public static function get_prompts() {
		$presets = self::get_presets();

		if ( \is_wp_error( $presets ) ) {
			return $presets;
		}

		return $presets['prompts'];
	}

	/**
	 * Update saved inputs for the given prompt.
	 *
	 * @param string $slug Prompt slug.
	 * @param array  $inputs Array of user inputs for the prompt's fields.
	 * @return array|WP_Error Array of prompt configs.
	 */
	public static function update_prompt( $slug, $inputs ) {
		$newspack_popups = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );
		$presets         = $newspack_popups->update_preset_prompt( $slug, $inputs );

		if ( \is_wp_error( $presets ) ) {
			return $presets;
		}

		return $presets['prompts'];
	}
}
