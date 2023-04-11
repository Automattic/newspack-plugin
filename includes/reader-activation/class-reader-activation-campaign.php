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
	 * Cached default configs.
	 *
	 * @var array
	 */
	private static $default_config = null;

	/**
	 * Get default prompt + segment config from the Campaigns plugin.
	 *
	 * @return array Default prompt + segment config.
	 */
	private static function get_defaults() {
		if ( ! empty( self::$default_config ) ) {
			return self::$default_config;
		}

		$newspack_popups = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );
		$default_config  = $newspack_popups->get_ras_defaults();

		self::$default_config = $default_config;

		return $default_config;
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
	 *
	 * @return array Array of default prompt configs.
	 */
	private static function get_default_prompt_config() {
		$defaults = self::get_defaults();
		return $defaults['prompts'];
	}

	/**
	 * Get saved prompt configs, or defaults.
	 *
	 * @return array Array of prompt configs.
	 */
	public static function get_prompts() {
		$newspack_popups = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );
		$default_prompts = self::get_default_prompt_config();
		$saved_inputs    = \get_option( self::OPTION_NAME, [] );
		$lists           = self::get_newsletter_lists();

		// Populate prompt configs with saved inputs.
		$default_prompts = array_map(
			function( $prompt ) use ( $lists, $newspack_popups, $saved_inputs ) {
				// Check for saved inputs.
				if ( ! empty( $saved_inputs[ $prompt['slug'] ] ) ) {
					$fields                      = array_map(
						function ( $field ) use ( $saved_inputs, $prompt ) {
							if ( isset( $saved_inputs[ $prompt['slug'] ][ $field['name'] ] ) ) {
								$field['value'] = $saved_inputs[ $prompt['slug'] ][ $field['name'] ];
							}
							return $field;
						},
						$prompt['user_input_fields']
					);
					$prompt['user_input_fields'] = $fields;

					// Mark as ready if all required inputs are filled.
					if ( $saved_inputs[ $prompt['slug'] ]['ready'] ) {
						$prompt['ready'] = true;
					}
				}

				// Populate placeholder content with saved inputs or default values.
				foreach ( $prompt['user_input_fields'] as $field ) {
					$prompt['content'] = $newspack_popups->process_user_inputs( $prompt['content'], $field );
				}

				// Append newsletter list IDs as a selectable field.
				if ( false !== strpos( $prompt['slug'], '_registration_' ) || false !== strpos( $prompt['slug'], '_newsletter_' ) ) {
					$fields                      = array_map(
						function( $field ) use ( $lists ) {
							if ( 'lists' === $field['name'] ) {
								$field['options'] = $lists;
							}

							return $field;
						},
						$prompt['user_input_fields']
					);
					$prompt['user_input_fields'] = $fields;
				}

				return $prompt;
			},
			$default_prompts
		);

		return $default_prompts;
	}

	/**
	 * Update saved inputs for the given prompt.
	 *
	 * @param string $slug Prompt slug.
	 * @param array  $inputs Array user inputs, keyed by field name.
	 */
	public static function update_prompt( $slug, $inputs ) {
		$default_prompts = self::get_default_prompt_config();
		$saved_inputs    = \get_option( self::OPTION_NAME, [] );
		$updated         = false;
		$ready           = true;
		$default_fields  = array_reduce(
			$default_prompts,
			function( $acc, $default_prompt ) {
				$acc[ $default_prompt['slug'] ] = array_map(
					function( $field ) {
						return $field['name'];
					},
					$default_prompt['user_input_fields']
				);
				return $acc;
			},
			[]
		);

		// Validate prompt slug.
		if ( ! isset( $default_fields[ $slug ] ) ) {
			return new \WP_Error( 'newspack_popups_update_ras_prompt_error', __( 'Invalid prompt slug.', 'newspack' ) );
		}

		foreach ( $inputs as $field_name => $input ) {
			// Validate prompt fields.
			if ( ! in_array( $field_name, $default_fields[ $slug ], true ) ) {
				return new \WP_Error( 'newspack_popups_update_ras_prompt_error', __( 'Invalid field name.', 'newspack' ) );
			}

			if ( isset( $input ) ) {
				$saved_inputs[ $slug ][ $field_name ] = $input;
			}

			if ( empty( $saved_inputs[ $slug ][ $field_name ] ) ) {
				$ready = false;
			}
		}

		if ( $ready ) {
			$saved_inputs[ $slug ]['ready'] = true;
		} else {
			unset( $saved_inputs[ $slug ]['ready'] );
		}

		\update_option( self::OPTION_NAME, $saved_inputs );

		return self::get_prompts();
	}
}
