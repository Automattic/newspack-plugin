<?php
/**
 * Access Rule Bridge for Abilities API.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Discovers abilities in the content-access category and registers them
 * as access rules via Access_Rules::register_rule().
 */
class Access_Rule_Bridge {

	/**
	 * Discover content-access abilities and bridge them into Access_Rules.
	 *
	 * Runs on wp_abilities_api_init at priority 20, after plugins register abilities.
	 * Third-party plugins must register content-access abilities at priority 10 or earlier.
	 */
	public static function bridge_discovered_rules(): void {
		$registry  = \WP_Abilities_Registry::get_instance();
		$abilities = $registry->get_all_registered();

		if ( empty( $abilities ) ) {
			return;
		}

		$existing_rules = Access_Rules::get_registered_rules();

		foreach ( $abilities as $ability ) {
			if ( 'content-access' !== $ability->get_category() ) {
				continue;
			}

			// Validate schema: output must include has_access.
			$output_schema = $ability->get_output_schema();
			if (
				! isset( $output_schema['properties']['has_access'] ) ||
				'boolean' !== ( $output_schema['properties']['has_access']['type'] ?? '' )
			) {
				_doing_it_wrong(
					__METHOD__,
					esc_html(
						sprintf(
							/* translators: %s: ability name */
							__( 'Ability "%s" in content-access category must have has_access (boolean) in output schema.', 'newspack-plugin' ),
							$ability->get_name()
						)
					),
					'6.35.0'
				);
				continue;
			}

			// Skip abilities whose meta.rule_id matches an existing rule (avoid duplicating built-ins).
			$meta    = $ability->get_meta();
			$rule_id = $meta['rule_id'] ?? null;
			if ( $rule_id && isset( $existing_rules[ $rule_id ] ) ) {
				continue;
			}

			// Use ability name as rule ID.
			$ability_name = $ability->get_name();
			if ( isset( $existing_rules[ $ability_name ] ) ) {
				continue;
			}

			Access_Rules::register_rule(
				[
					'id'          => $ability_name,
					'name'        => $ability->get_label(),
					'description' => $ability->get_description(),
					'callback'    => self::create_ability_callback( $ability ),
				]
			);
		}
	}

	/**
	 * Create a rule callback that wraps an ability's execute method.
	 *
	 * @param \WP_Ability $ability The ability to wrap.
	 * @return callable
	 */
	private static function create_ability_callback( $ability ): callable {
		return function ( $user_id, $args = null ) use ( $ability ) {
			$result = $ability->execute(
				[
					'user_id' => $user_id,
					'args'    => $args,
				]
			);
			return ! empty( $result['has_access'] );
		};
	}
}
