<?php
/**
 * Content Gate Abilities API integration.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Orchestrates the Abilities API integration for content gating.
 */
class Content_Gate_Abilities {

	/**
	 * Check if the Abilities API is available.
	 *
	 * @return bool
	 */
	public static function is_available(): bool {
		return function_exists( 'wp_register_ability' );
	}

	/**
	 * Initialize the Abilities API integration.
	 */
	public static function init(): void {
		if ( ! self::is_available() ) {
			return;
		}
		include_once __DIR__ . '/class-content-gate-ability-registry.php';
		include_once __DIR__ . '/class-access-rule-bridge.php';
		add_action( 'wp_abilities_api_categories_init', [ __CLASS__, 'register_categories' ] );
		add_action( 'wp_abilities_api_init', [ Content_Gate_Ability_Registry::class, 'register_abilities' ] );
		add_action( 'wp_abilities_api_init', [ Access_Rule_Bridge::class, 'bridge_discovered_rules' ], 20 );
	}

	/**
	 * Register ability categories.
	 */
	public static function register_categories(): void {
		wp_register_ability_category(
			'content-gating',
			[
				'label'       => __( 'Content Gating', 'newspack-plugin' ),
				'description' => __( 'Abilities for querying content gate state and configuration.', 'newspack-plugin' ),
			]
		);
		wp_register_ability_category(
			'content-access',
			[
				'label'       => __( 'Content Access', 'newspack-plugin' ),
				'description' => __( 'Access-check abilities that can be used as content gate rules.', 'newspack-plugin' ),
			]
		);
	}
}
Content_Gate_Abilities::init();
