<?php
/**
 * Newspack Group Subscriptions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Group_Subscriptions {
	/**
	 * Default group subscription settings.
	 */
	const DEFAULT_SETTINGS = [
		'enabled'  => false,
		'limit'    => 0,
		'user_ids' => [],
	];

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		// Add Group Subscription options to subscription and variable subscription product admin pages.
		add_filter( 'newspack_custom_product_options', [ __CLASS__, 'add_custom_product_options' ] );
		add_filter( 'newspack_custom_product_pricing_options', [ __CLASS__, 'add_custom_product_pricing_options' ] );

		// Add Group Subscription options to subscription admin pages.
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_group_subscription_meta_box' ], 20, 2 );
		add_action( 'woocommerce_process_shop_order_meta', [ __CLASS__, 'save_group_subscription_meta' ], 10, 2 );
		add_action( 'wp_ajax_newspack_group_subscription_search_users', [ __CLASS__, 'ajax_search_users' ] );
	}

	/**
	 * Add custom product options.
	 *
	 * @param array $custom_options Keyed array of custom product options.
	 *
	 * @return array Keyed array of custom product options.
	 */
	public static function add_custom_product_options( $custom_options ) {
		if ( ! Content_Gate::is_newspack_feature_enabled() ) {
			return $custom_options;
		}
		$custom_options['newspack_group_subscription_enabled'] = [
			'id'            => '_newspack_group_subscription_enabled',
			'label'         => __( 'Group subscription', 'newspack-plugin' ),
			'description'   => __( 'Enable group subscriptions for this product.', 'newspack-plugin' ),
			'default'       => self::DEFAULT_SETTINGS['enabled'],
			'product_types' => [ 'subscription', 'subscription_variation' ],
			'type'          => 'boolean',
			'wrapper_class' => 'show_if_subscription',
		];
		return $custom_options;
	}

	/**
	 * Add custom product pricing options.
	 *
	 * @param array $custom_product_pricing_options Keyed array of custom product pricing options.
	 *
	 * @return array Keyed array of custom product pricing options.
	 */
	public static function add_custom_product_pricing_options( $custom_product_pricing_options ) {
		if ( ! Content_Gate::is_newspack_feature_enabled() ) {
			return $custom_product_pricing_options;
		}
		$custom_product_pricing_options['newspack_group_subscription_limit'] = [
			'id'                => '_newspack_group_subscription_limit',
			'wrapper_class'     => 'show_if_newspack_group_subscription_enabled',
			'label'             => __( 'Group subscription member limit', 'newspack-plugin' ),
			'desc_tip'          => true,
			'description'       => __( 'Set the maximum number of members for group subscriptions. Set to 0 to allow an unlimited number of group members.', 'newspack-plugin' ),
			'default'           => self::DEFAULT_SETTINGS['limit'],
			'product_types'     => [ 'subscription', 'subscription_variation' ],
			'type'              => 'number',
			'custom_attributes' => [
				'step' => 1,
				'min'  => 0,
			],
		];
		return $custom_product_pricing_options;
	}

	/**
	 * Get the group subscription settings for a product.
	 *
	 * @param WC_Product|int $product The product object or ID.
	 *
	 * @return array The group subscription settings.
	 */
	public static function get_product_settings( $product ) {
		$settings = self::DEFAULT_SETTINGS;
		if ( ! function_exists( 'wc_get_product' ) ) {
			return $settings;
		}
		if ( ! is_a( $product, 'WC_Product' ) ) {
			$product = \wc_get_product( $product );
		}
		if ( ! $product ) {
			return $settings;
		}
		$settings['enabled'] = $product->get_meta( '_newspack_group_subscription_enabled', true ) ? \wc_string_to_bool( $product->get_meta( '_newspack_group_subscription_enabled', true ) ) : self::DEFAULT_SETTINGS['enabled'];
		$settings['limit']   = (int) $product->get_meta( '_newspack_group_subscription_limit', true ) ?: self::DEFAULT_SETTINGS['limit']; // phpcs:ignore Universal.Operators.DisallowShortTernary.Found

		/**
		 * Filter the group subscription settings for a product.
		 *
		 * @param array $settings The group subscription settings.
		 * @param WC_Product $product The product object.
		 */
		return apply_filters( 'newspack_group_subscription_product_settings', $settings, $product );
	}

	/**
	 * Get the product ID for a subscription.
	 *
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return int The product ID.
	 */
	public static function get_subscription_product_id( $subscription ) {
		$product_id = false;
		foreach ( $subscription->get_items() as $item ) {
			$product_id = \wcs_get_canonical_product_id( $item );
			if ( $product_id ) {
				break;
			}
		}
		return $product_id;
	}

	/**
	 * Get the group subscription settings for a subscription.
	 *
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return array The group subscription settings.
	 */
	public static function get_subscription_settings( $subscription ) {
		if ( ! function_exists( 'wcs_get_subscription' ) || ! function_exists( 'wcs_get_canonical_product_id' ) ) {
			return self::DEFAULT_SETTINGS;
		}
		if ( ! is_a( $subscription, 'WC_Subscription' ) ) {
			$subscription = \wcs_get_subscription( $subscription );
		}
		if ( ! $subscription ) {
			return self::DEFAULT_SETTINGS;
		}
		$product_id           = self::get_subscription_product_id( $subscription );
		$settings             = self::get_product_settings( $product_id );
		$settings['enabled']  = $subscription->get_meta( '_newspack_group_subscription_enabled', true ) ? \wc_string_to_bool( $subscription->get_meta( '_newspack_group_subscription_enabled', true ) ) : $settings['enabled'];
		$settings['limit']    = (int) $subscription->get_meta( '_newspack_group_subscription_limit', true ) ?: $settings['limit']; // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
		$settings['user_ids'] = $subscription->get_meta( '_newspack_group_subscription_user_ids', true ) ? array_map( 'intval', explode( ',', $subscription->get_meta( '_newspack_group_subscription_user_ids', true ) ) ) : [];
		/**
		 * Filter the group subscription settings for a subscription.
		 *
		 * @param array $settings The group subscription settings.
		 * @param WC_Subscription $subscription The subscription object.
		 */
		return apply_filters( 'newspack_group_subscription_settings', $settings, $subscription );
	}

	/**
	 * Add Group Subscription meta box to subscription admin pages.
	 *
	 * @param string                  $post_type The post type of the current post being edited.
	 * @param WP_Post|WC_Subscription $post_or_subscription The post or subscription currently being edited.
	 */
	public static function add_group_subscription_meta_box( $post_type, $post_or_subscription ) {
		if ( ! Content_Gate::is_newspack_feature_enabled() || ! function_exists( 'wcs_is_subscription' ) || ! \wcs_is_subscription( $post_or_subscription ) ) {
			return;
		}
		\add_meta_box(
			'newspack-group-subscription',
			__( 'Group subscription', 'newspack-plugin' ),
			[ __CLASS__, 'add_group_subscription_options' ],
			$post_type,
			'side',
			'high'
		);
	}

	/**
	 * Add Group Subscription options to subscription admin pages.
	 *
	 * @param WC_Subscription $subscription The subscription object.
	 */
	public static function add_group_subscription_options( $subscription ) {
		if ( ! $subscription || ! Content_Gate::is_newspack_feature_enabled() || ! function_exists( 'wcs_is_subscription' ) || ! wcs_is_subscription( $subscription ) ) {
			return;
		}
		$settings = self::get_subscription_settings( $subscription );
		$product  = \wc_get_product( self::get_subscription_product_id( $subscription ) );
		?>
		<p>
		<?php
		echo wp_kses_post(
			sprintf(
				/* translators: %s: The product edit link or 'the product' if no product is found. */
				__( 'Changing these settings will override settings inherited from %s.', 'newspack-plugin' ),
				$product ? '<a href="' . \admin_url( 'post.php?post=' . ( $product->get_parent_id() ?: $product->get_id() ) . '&action=edit' ) . '">' . $product->get_name() . '</a>' : __( 'the product', 'newspack-plugin' ) // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
			)
		);
		?>
		</p>
		<p>
			<label for="_newspack_group_subscription_enabled">
				<input
					type="checkbox"
					id="_newspack_group_subscription_enabled"
					name="_newspack_group_subscription_enabled"
					value="yes"
					<?php checked( $settings['enabled'], true ); ?>
				/>
				<?php esc_html_e( 'Group subscription enabled', 'newspack-plugin' ); ?>
			</label>
		</p>
		<div class="form-row">
			<?php
			$pricing_options = self::add_custom_product_pricing_options( [] );
			foreach ( $pricing_options as $option_key => $option_config ) {
				if ( $option_key === 'newspack_group_subscription_limit' ) {
					$option_config['value'] = $settings['limit'];
					echo wp_kses_post( \woocommerce_wp_text_input( $option_config ) );
					break;
				}
			}
			?>
		</div>
		<div class="form-row show_if_newspack_group_subscription_enabled">
			<label for="_newspack_group_subscription_user_ids">
				<?php esc_html_e( 'Group members', 'newspack-plugin' ); ?>
			</label>
			<select id="_newspack_group_subscription_user_ids" name="_newspack_group_subscription_user_ids[]" multiple="multiple">
				<?php
				foreach ( $settings['user_ids'] as $user_id ) :
					$user = get_user_by( 'id', $user_id );
					if ( ! $user || ! Reader_Activation::is_user_reader( $user ) ) {
						continue;
					}
					?>
					<option value="<?php echo esc_attr( $user_id ); ?>" selected="selected">
						<?php echo esc_html( $user->user_email ); ?>
					</option>
					<?php
				endforeach;
				?>
			</select>
			<script>
				jQuery( document ).ready( function() {
					jQuery( '#_newspack_group_subscription_user_ids' ).select2( {
						ajax: {
							url: ajaxurl,
							dataType: 'json',
							type: 'POST',
							delay: 1000,
							data: function( params ) {
								return {
									action: 'newspack_group_subscription_search_users',
									search: params.term,
									nonce: '<?php echo wp_create_nonce( 'newspack_group_subscription_search_users' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>'
								};
							},
							processResults: function( data ) {
								return {
									results: data
								};
							},
							cache: true
						},
						minimumInputLength: 2,
						placeholder: '<?php esc_html_e( 'Search for a reader...', 'newspack-plugin' ); ?>',
						allowClear: true
					} );
				} );
			</script>
		</div>
		<?php
	}

	/**
	 * Handle AJAX search for users.
	 */
	public static function ajax_search_users() {
		check_ajax_referer( 'newspack_group_subscription_search_users', 'nonce' );
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( 'Insufficient permissions' );
		}
		if ( ! isset( $_POST['search'] ) ) {
			wp_die( 'Invalid request' );
		}
		$search = sanitize_text_field( $_POST['search'] );
		$query1 = get_users(
			/**
			 * Filter the user query args for searching for group subscription users.
			 *
			 * @param array $query_args Query args.
			 * @param string $query_type Query type: main_query or meta_query.
			 */
			apply_filters(
				'newspack_group_subscription_user_query_args',
				[
					'fields'         => [ 'ID', 'user_email' ],
					'search'         => $search,
					'search_columns' => [ 'ID', 'user_login', 'user_url', 'user_email', 'user_nicename', 'display_name' ],
					'role__in'       => Reader_Activation::get_reader_roles(),
				],
				'main_query'
			)
		);
		$query2 = get_users(
			/**
			 * Filter the user query args for searching for group subscription users.
			 *
			 * @param array $query_args Query args.
			 * @param string $query_type Query type: main_query or meta_query.
			 */
			apply_filters(
				'newspack_group_subscription_user_query_args',
				[
					'fields'     => [ 'ID', 'user_email' ],
					'role__in'   => Reader_Activation::get_reader_roles(),
					'meta_query' => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
						'relation' => 'OR',
						[
							'key'     => 'first_name',
							'value'   => $search,
							'compare' => 'LIKE',
						],
						[
							'key'     => 'last_name',
							'value'   => $search,
							'compare' => 'LIKE',
						],
					],
				],
				'meta_query'
			)
		);
		$users = array_map(
			function( $user ) {
				return [
					'id'   => $user->ID,
					'text' => $user->user_email . ' (#' . $user->ID . ')',
				];
			},
			array_merge( $query1, $query2 )
		);
		wp_send_json( $users );
	}

	/**
	 * Save Group Subscription meta to a subscription.
	 *
	 * @param int             $subscription_id Subscription ID.
	 * @param WC_Subscription $subscription Optional. Subscription object. Default null - will be loaded from the ID.
	 */
	public static function save_group_subscription_meta( $subscription_id, $subscription = null ) {
		if ( ! function_exists( 'wcs_is_subscription' ) || ! function_exists( 'wcs_get_subscription' ) || ! function_exists( 'wc_clean' ) || ! \wcs_is_subscription( $subscription_id ) ) {
			return;
		}

		// Verify save nonce. See: WCS_Meta_Box_Subscription_Data::save().
		if ( empty( $_POST['woocommerce_meta_nonce'] ) || ! \wp_verify_nonce( \wc_clean( \wp_unslash( $_POST['woocommerce_meta_nonce'] ) ), 'woocommerce_save_data' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return;
		}

		// Get subscription object.
		$subscription      = is_a( $subscription, 'WC_Subscription' ) ? $subscription : \wcs_get_subscription( $subscription_id );
		$previous_settings = self::get_subscription_settings( $subscription );
		$is_enabled        = filter_input( INPUT_POST, '_newspack_group_subscription_enabled', FILTER_VALIDATE_BOOLEAN );
		$limit             = filter_input( INPUT_POST, '_newspack_group_subscription_limit', FILTER_SANITIZE_NUMBER_INT );
		$user_ids          = filter_input( INPUT_POST, '_newspack_group_subscription_user_ids', FILTER_SANITIZE_NUMBER_INT, FILTER_REQUIRE_ARRAY );
		$should_save       = false;

		if ( $is_enabled !== $previous_settings['enabled'] ) {
			$subscription->update_meta_data( '_newspack_group_subscription_enabled', \wc_bool_to_string( $is_enabled ) );
			$should_save = true;
		}
		if ( $limit !== $previous_settings['limit'] ) {
			$subscription->update_meta_data( '_newspack_group_subscription_limit', $limit );
			$should_save = true;
		}
		if ( $user_ids !== $previous_settings['user_ids'] ) {
			$subscription->update_meta_data( '_newspack_group_subscription_user_ids', implode( ',', $user_ids ) );
			$should_save = true;
		}
		if ( $should_save ) {
			$subscription->save();
		}
	}

	/**
	 * Check if a subscription is a group subscription.
	 *
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return bool Whether the subscription is a group subscription.
	 */
	public static function is_group_subscription( $subscription ) {
		$settings = self::get_subscription_settings( $subscription );
		return $settings['enabled'];
	}

	/**
	 * Get the managers of a group subscription.
	 *
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return int[]|null The group manager user IDs or null if not a group subscription.
	 */
	public static function get_managers( $subscription ) {
		if ( ! self::is_group_subscription( $subscription ) ) {
			return null;
		}

		if ( ! is_a( $subscription, 'WC_Subscription' ) ) {
			$subscription = \wcs_get_subscription( $subscription );
		}

		/**
		 * Filter the managers of a group subscription.
		 * Currently this is only the subscription owner.
		 *
		 * @param int[] $user_ids The group manager user IDs.
		 * @param WC_Subscription $subscription The subscription object.
		 */
		return apply_filters( 'newspack_group_subscription_managers', [ $subscription->get_user_id() ], $subscription );
	}

	/**
	 * Get the members of a group subscription.
	 *
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return int[]|null The group member user IDs or null if not a group subscription.
	 */
	public static function get_members( $subscription ) {
		if ( ! self::is_group_subscription( $subscription ) ) {
			return null;
		}
		$settings = self::get_subscription_settings( $subscription );

		/**
		 * Filter the members of a group subscription.
		 *
		 * @param int[] $user_ids The group member user IDs.
		 * @param WC_Subscription $subscription The subscription object.
		 */
		return apply_filters( 'newspack_group_subscription_members', $settings['user_ids'], $subscription );
	}

	/**
	 * Check if a user has access to a group subscription.
	 *
	 * @param int                 $user_id The user ID.
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return bool|null Whether the user has access to the group subscription, or null if not a group subscription.
	 */
	public static function user_can_access( $user_id, $subscription ) {
		if ( ! self::is_group_subscription( $subscription ) ) {
			return null;
		}
		$can_access = in_array( $user_id, self::get_managers( $subscription ), true ) || in_array( $user_id, self::get_members( $subscription ), true );

		/**
		 * Filter whether a user can access a group subscription.
		 *
		 * @param bool $can_access Whether the user can access the group subscription.
		 * @param int $user_id The user ID.
		 * @param WC_Subscription $subscription The subscription object.
		 */
		return apply_filters( 'newspack_group_subscription_user_can_access', $can_access, $user_id, $subscription );
	}
}
Group_Subscriptions::init();
