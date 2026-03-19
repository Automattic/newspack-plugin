<?php
/**
 * Content Gate Ability Registry.
 *
 * Registers read-only and access-check abilities for the Abilities API.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Registers content gating abilities with the Abilities API.
 */
class Content_Gate_Ability_Registry {

	/**
	 * Register all abilities.
	 */
	public static function register_abilities(): void {
		self::register_read_only_abilities();
		self::register_access_check_abilities();
	}

	/**
	 * Register read-only abilities in the content-gating category.
	 */
	private static function register_read_only_abilities(): void {
		wp_register_ability(
			'newspack/check-content-access',
			[
				'label'               => __( 'Check Content Access', 'newspack-plugin' ),
				'category'            => 'content-gating',
				'description'         => __( 'Check whether a post is restricted and identify the gate.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_check_content_access' ],
				'permission_callback' => '__return_true',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'post_id' => [
							'type'        => 'integer',
							'description' => __( 'The post ID to check.', 'newspack-plugin' ),
						],
						'user_id' => [
							'type'        => 'integer',
							'description' => __( 'Optional user ID to check access for. Requires manage_options.', 'newspack-plugin' ),
						],
					],
					'required'   => [ 'post_id' ],
				],
				'output_schema'       => [
					'type'       => 'object',
					'properties' => [
						'has_access' => [ 'type' => 'boolean' ],
						'gate_id'    => [ 'type' => [ 'integer', 'null' ] ],
						'reason'     => [ 'type' => 'string' ],
					],
				],
				'meta'                => [
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);

		wp_register_ability(
			'newspack/list-gates',
			[
				'label'               => __( 'List Gates', 'newspack-plugin' ),
				'category'            => 'content-gating',
				'description'         => __( 'List all published content gates.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_list_gates' ],
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'meta'                => [
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);

		wp_register_ability(
			'newspack/get-gate-for-post',
			[
				'label'               => __( 'Get Gate for Post', 'newspack-plugin' ),
				'category'            => 'content-gating',
				'description'         => __( 'Get the gate configuration for a specific post.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_get_gate_for_post' ],
				'permission_callback' => '__return_true',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'post_id' => [
							'type'        => 'integer',
							'description' => __( 'The post ID to get gate for.', 'newspack-plugin' ),
						],
					],
					'required'   => [ 'post_id' ],
				],
				'meta'                => [
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);

		wp_register_ability(
			'newspack/get-metering-status',
			[
				'label'               => __( 'Get Metering Status', 'newspack-plugin' ),
				'category'            => 'content-gating',
				'description'         => __( 'Get metering settings and current user view count.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_get_metering_status' ],
				'permission_callback' => '__return_true',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'gate_id' => [
							'type'        => 'integer',
							'description' => __( 'The gate ID to get metering settings for.', 'newspack-plugin' ),
						],
					],
				],
				'meta'                => [
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);
	}

	/**
	 * Register access-check abilities in the content-access category.
	 */
	private static function register_access_check_abilities(): void {
		wp_register_ability(
			'newspack/access-subscription',
			[
				'label'               => __( 'Access: Active Subscription', 'newspack-plugin' ),
				'category'            => 'content-access',
				'description'         => __( 'Check if a user has an active subscription to specified products.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_access_subscription' ],
				'permission_callback' => '__return_true',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'user_id'     => [
							'type'        => 'integer',
							'description' => __( 'User ID to check. Defaults to current user.', 'newspack-plugin' ),
						],
						'product_ids' => [
							'type'        => 'array',
							'items'       => [ 'type' => 'integer' ],
							'description' => __( 'Product IDs to check subscription for.', 'newspack-plugin' ),
						],
					],
				],
				'output_schema'       => [
					'type'       => 'object',
					'properties' => [
						'has_access' => [ 'type' => 'boolean' ],
					],
				],
				'meta'                => [
					'rule_id'      => 'subscription',
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);

		wp_register_ability(
			'newspack/access-email-domain',
			[
				'label'               => __( 'Access: Email Domain', 'newspack-plugin' ),
				'category'            => 'content-access',
				'description'         => __( 'Check if a user email belongs to a whitelisted domain.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_access_email_domain' ],
				'permission_callback' => '__return_true',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'user_id' => [
							'type'        => 'integer',
							'description' => __( 'User ID to check. Defaults to current user.', 'newspack-plugin' ),
						],
						'domains' => [
							'type'        => 'string',
							'description' => __( 'Comma-separated list of allowed email domains.', 'newspack-plugin' ),
						],
					],
					'required'   => [ 'domains' ],
				],
				'output_schema'       => [
					'type'       => 'object',
					'properties' => [
						'has_access' => [ 'type' => 'boolean' ],
					],
				],
				'meta'                => [
					'rule_id'      => 'email_domain',
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);

		wp_register_ability(
			'newspack/access-reader-data',
			[
				'label'               => __( 'Access: Reader Data', 'newspack-plugin' ),
				'category'            => 'content-access',
				'description'         => __( 'Check if a user has specific reader data key/value pairs.', 'newspack-plugin' ),
				'execute_callback'    => [ __CLASS__, 'execute_access_reader_data' ],
				'permission_callback' => '__return_true',
				'input_schema'        => [
					'type'       => 'object',
					'properties' => [
						'user_id' => [
							'type'        => 'integer',
							'description' => __( 'User ID to check. Defaults to current user.', 'newspack-plugin' ),
						],
						'data'    => [
							'type'        => 'string',
							'description' => __( 'Semicolon-separated key=value pairs to check.', 'newspack-plugin' ),
						],
					],
					'required'   => [ 'data' ],
				],
				'output_schema'       => [
					'type'       => 'object',
					'properties' => [
						'has_access' => [ 'type' => 'boolean' ],
					],
				],
				'meta'                => [
					'rule_id'      => 'reader_data',
					'show_in_rest' => true,
					'annotations'  => [ 'readonly' => true ],
				],
			]
		);
	}

	/**
	 * Execute check-content-access ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array Result with has_access, gate_id, and reason.
	 */
	public static function execute_check_content_access( array $input ): array {
		$post_id = $input['post_id'] ?? 0;
		$user_id = $input['user_id'] ?? null;

		$post = get_post( $post_id );
		if ( ! $post ) {
			return [
				'has_access' => true,
				'gate_id'    => null,
				'reason'     => 'post_not_found',
			];
		}

		$original_user = null;

		// If checking for a different user, require manage_options and swap context.
		if ( null !== $user_id && $user_id !== get_current_user_id() ) {
			if ( ! current_user_can( 'manage_options' ) ) {
				return [
					'has_access' => false,
					'gate_id'    => null,
					'reason'     => 'permission_denied',
				];
			}
			$original_user = get_current_user_id();
			wp_set_current_user( $user_id );
		}

		$is_restricted = Content_Gate::is_post_restricted( $post_id );
		$gate_id       = Content_Restriction_Control::get_gate_post_id( $post_id );

		// Restore original user context.
		if ( null !== $original_user ) {
			wp_set_current_user( $original_user );
		}

		if ( ! $is_restricted ) {
			return [
				'has_access' => true,
				'gate_id'    => null,
				'reason'     => 'no_gate',
			];
		}

		return [
			'has_access' => false,
			'gate_id'    => $gate_id ? (int) $gate_id : null,
			'reason'     => 'restricted',
		];
	}

	/**
	 * Execute list-gates ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array List of published gates.
	 */
	public static function execute_list_gates( array $input ): array {
		return Content_Gate::get_gates( Content_Gate::GATE_CPT, 'publish' );
	}

	/**
	 * Execute get-gate-for-post ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array Gate configuration for the post.
	 */
	public static function execute_get_gate_for_post( array $input ): array {
		$post_id = $input['post_id'] ?? 0;
		return Content_Restriction_Control::get_post_gates( $post_id );
	}

	/**
	 * Execute get-metering-status ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array Metering status with settings and view count.
	 */
	public static function execute_get_metering_status( array $input ): array {
		$gate_id = $input['gate_id'] ?? null;

		if ( ! $gate_id ) {
			return [
				'metered'  => false,
				'settings' => null,
				'views'    => 0,
			];
		}

		$settings = Metering::get_metering_settings( $gate_id );
		$views    = Metering::get_current_user_metered_views();

		return [
			'metered'  => ! empty( $settings['enabled'] ),
			'settings' => $settings,
			'views'    => $views,
		];
	}

	/**
	 * Execute access-subscription ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array Result with has_access boolean.
	 */
	public static function execute_access_subscription( array $input ): array {
		$user_id     = $input['user_id'] ?? get_current_user_id();
		$product_ids = $input['product_ids'] ?? [];

		return [
			'has_access' => Access_Rules::has_active_subscription( $user_id, $product_ids ),
		];
	}

	/**
	 * Execute access-email-domain ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array Result with has_access boolean.
	 */
	public static function execute_access_email_domain( array $input ): array {
		$user_id = $input['user_id'] ?? get_current_user_id();
		$domains = $input['domains'] ?? '';

		return [
			'has_access' => Access_Rules::is_email_domain_whitelisted( $user_id, $domains ),
		];
	}

	/**
	 * Execute access-reader-data ability.
	 *
	 * @param array $input The ability input arguments.
	 * @return array Result with has_access boolean.
	 */
	public static function execute_access_reader_data( array $input ): array {
		$user_id = $input['user_id'] ?? get_current_user_id();
		$data    = $input['data'] ?? '';

		return [
			'has_access' => Access_Rules::has_reader_data( $user_id, $data ),
		];
	}
}
