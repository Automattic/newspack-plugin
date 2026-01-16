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
		'enabled' => false,
		'limit'   => 0,
	];

	/**
	 * Subscription meta key for group subscription "enabled" flag.
	 */
	const GROUP_SUBSCRIPTION_ENABLED_META_KEY = '_newspack_group_subscription_enabled';

	/**
	 * Subscription meta key for group subscription limit.
	 */
	const GROUP_SUBSCRIPTION_LIMIT_META_KEY = '_newspack_group_subscription_limit';

	/**
	 * User meta key for group subscription associations.
	 */
	const GROUP_SUBSCRIPTION_USER_META_KEY = '_newspack_group_subscription';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		// Add Group Subscription options to subscription and variable subscription product admin pages.
		add_filter( 'newspack_custom_product_options', [ __CLASS__, 'add_custom_product_options' ] );
		add_filter( 'newspack_custom_product_pricing_options', [ __CLASS__, 'add_custom_product_pricing_options' ] );

		// Add Group Subscription options to subscription admin pages.
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'admin_enqueue_scripts' ] );
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_group_subscription_meta_box' ], 20, 2 );
		add_action( 'woocommerce_process_shop_order_meta', [ __CLASS__, 'save_group_subscription_meta' ], 10, 2 );
		add_action( 'wp_ajax_newspack_group_subscription_search_users', [ __CLASS__, 'ajax_search_users' ] );
	}

	/**
	 * Enqueue admin scripts.
	 */
	public static function admin_enqueue_scripts() {
		if ( ! function_exists( 'wcs_get_page_screen_id' ) ) {
			return;
		}
		$screen = get_current_screen();
		$is_subscription_screen = in_array(
			$screen->id,
			[
				'edit-shop_subscription',
				'shop_subscription',
				wcs_get_page_screen_id( 'shop_subscription' ),
			],
			true
		);
		if ( ! $is_subscription_screen ) {
			return;
		}
		\wp_enqueue_script(
			'newspack-group-subscriptions',
			Newspack::plugin_url() . '/dist/other-scripts/group-subscriptions.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_enqueue_style(
			'newspack-group-subscriptions',
			Newspack::plugin_url() . '/dist/other-scripts/group-subscriptions.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
		\wp_localize_script(
			'newspack-group-subscriptions',
			'newspackGroupSubscriptions',
			[
				'ajaxUrl'     => \admin_url( 'admin-ajax.php' ),
				'nonce'       => \wp_create_nonce( 'newspack_group_subscription_search_users' ),
				'placeholder' => __( 'Search for a reader...', 'newspack-plugin' ),
			]
		);
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
			'id'            => self::GROUP_SUBSCRIPTION_ENABLED_META_KEY,
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
			'id'                => self::GROUP_SUBSCRIPTION_LIMIT_META_KEY,
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
		$settings['enabled'] = $product->get_meta( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY, true ) ? \wc_string_to_bool( $product->get_meta( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY, true ) ) : self::DEFAULT_SETTINGS['enabled'];
		$settings['limit']   = (int) $product->get_meta( self::GROUP_SUBSCRIPTION_LIMIT_META_KEY, true ) ?: self::DEFAULT_SETTINGS['limit']; // phpcs:ignore Universal.Operators.DisallowShortTernary.Found

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
		$product_id          = self::get_subscription_product_id( $subscription );
		$settings            = self::get_product_settings( $product_id );
		$settings['enabled'] = $subscription->get_meta( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY, true ) ? \wc_string_to_bool( $subscription->get_meta( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY, true ) ) : $settings['enabled'];
		$settings['limit']   = (int) $subscription->get_meta( self::GROUP_SUBSCRIPTION_LIMIT_META_KEY, true ) ?: $settings['limit']; // phpcs:ignore Universal.Operators.DisallowShortTernary.Found

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
			'normal',
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
		$members  = self::get_members( $subscription );
		?>
		<div class="newspack-group-subscription--settings">
			<h3><?php esc_html_e( 'Settings', 'newspack-plugin' ); ?></h3>
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
				<label for="<?php echo esc_attr( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY ); ?>">
					<input
						type="checkbox"
						id="<?php echo esc_attr( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY ); ?>"
						name="<?php echo esc_attr( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY ); ?>"
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
		</div>
		<div class="newspack-group-subscription--members">
			<h3 class="form-row show_if_newspack_group_subscription_enabled">
				<?php
				echo esc_html(
					sprintf(
						// translators: %d: The number of group members.
						__( 'Group members (%d)', 'newspack-plugin' ),
						count( $members )
					)
				);
				?>
			</h3>
			<ul class="newspack-group-subscription--members-list show_if_newspack_group_subscription_enabled">
				<?php
				foreach ( $members as $member_id ) :
					$user = get_user_by( 'id', $member_id );
					if ( ! $user || ! Reader_Activation::is_user_reader( $user ) ) {
						continue;
					}
					?>
					<li>
						<a class="newspack-group-subscription--member-user-link" href="<?php echo esc_url( get_edit_user_link( $user->ID ) ); ?>"><?php echo esc_html( $user->user_email ); ?></a>
						<a title="<?php esc_attr_e( 'Remove', 'newspack-plugin' ); ?>" href="#" class="newspack-group-subscription--remove-member" data-user-id="<?php echo esc_attr( $user->ID ); ?>">
							&#215;
							<span class="screen-reader-text"><?php esc_html_e( 'Remove', 'newspack-plugin' ); ?></span>
					</a>
					</li>
					<?php
				endforeach;
				?>
			</ul>
			<div class="form-row show_if_newspack_group_subscription_enabled">
				<label for="_newspack_group_subscription_member_ids">
					<?php esc_html_e( 'Add new group members', 'newspack-plugin' ); ?>
				</label>
				<select id="_newspack_group_subscription_member_ids" name="_newspack_group_subscription_member_ids[]" multiple="multiple" data-owner-id="<?php echo esc_attr( $subscription->get_user_id() ); ?>">
					<option value="">
						<?php echo esc_html( 'Select a user...' ); ?>
					</option>
				</select>
			</div>
			<input type="hidden" id="newspack_group_subscription_member_ids_to_remove" name="newspack_group_subscription_member_ids_to_remove" />
		</div>
		<?php
	}

	/**
	 * Handle AJAX search for users.
	 */
	public static function ajax_search_users() {
		check_ajax_referer( 'newspack_group_subscription_search_users', 'nonce' );
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'Insufficient permissions', 'newspack' ) );
		}
		if ( ! isset( $_POST['search'] ) ) {
			wp_die( esc_html__( 'Invalid request', 'newspack' ) );
		}
		$search  = filter_input( INPUT_POST, 'search', FILTER_SANITIZE_SPECIAL_CHARS );
		$exclude = filter_input( INPUT_POST, 'exclude', FILTER_VALIDATE_INT, FILTER_REQUIRE_ARRAY );
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
					'exclude'        => $exclude,
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
					'exclude'    => $exclude,
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
	 * Update the member IDs for a group subscription.
	 *
	 * @param WC_Subscription $subscription The subscription object.
	 * @param int[]           $members_to_add Group member user IDs to add the subscription.
	 * @param int[]           $members_to_remove Group member user IDs to remove from the subscription.
	 *
	 * @return bool Whether the member IDs were updated.
	 */
	private static function update_members( $subscription, $members_to_add, $members_to_remove = [] ) {
		$updated = false;
		$members_to_add    = array_values( array_unique( array_map( 'absint', (array) $members_to_add ) ) );
		$members_to_remove = array_values( array_unique( array_map( 'absint', (array) $members_to_remove ) ) );

		// Add new members.
		foreach ( $members_to_add as $member_id ) {
			if ( ! Reader_Activation::is_user_reader( $member_id ) ) {
				continue;
			}

			// Avoid adding duplicate meta entries.
			$existing_group_subscription_ids = self::get_group_subscriptions_for_user( $member_id, true );
			if ( in_array( $subscription->get_id(), $existing_group_subscription_ids, true ) ) {
				continue;
			}
			\add_user_meta( $member_id, self::GROUP_SUBSCRIPTION_USER_META_KEY, $subscription->get_id() );
			$updated = true;
		}

		// Remove members.
		foreach ( $members_to_remove as $member_id ) {
			if ( ! Reader_Activation::is_user_reader( $member_id ) ) {
				continue;
			}
			\delete_user_meta( $member_id, self::GROUP_SUBSCRIPTION_USER_META_KEY, $subscription->get_id() );
			$updated = true;
		}
		return $updated;
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
		$is_enabled        = isset( $_POST[ self::GROUP_SUBSCRIPTION_ENABLED_META_KEY ] );
		$limit             = absint( filter_input( INPUT_POST, self::GROUP_SUBSCRIPTION_LIMIT_META_KEY, FILTER_SANITIZE_NUMBER_INT ) );
		$members_to_add    = filter_input( INPUT_POST, '_newspack_group_subscription_member_ids', FILTER_SANITIZE_NUMBER_INT, FILTER_REQUIRE_ARRAY );
		$members_to_remove = filter_input( INPUT_POST, 'newspack_group_subscription_member_ids_to_remove', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) ? explode( ',', filter_input( INPUT_POST, 'newspack_group_subscription_member_ids_to_remove', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) ) : [];
		$should_save       = false;

		if ( $is_enabled !== $previous_settings['enabled'] ) {
			$subscription->update_meta_data( self::GROUP_SUBSCRIPTION_ENABLED_META_KEY, \wc_bool_to_string( $is_enabled ) );
			$should_save = true;
		}
		if ( $limit !== $previous_settings['limit'] ) {
			$subscription->update_meta_data( self::GROUP_SUBSCRIPTION_LIMIT_META_KEY, $limit );
			$should_save = true;
		}
		self::update_members( $subscription, $members_to_add, $members_to_remove );
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
	 * @return int[] The group manager user IDs.
	 */
	public static function get_managers( $subscription ) {
		if ( ! self::is_group_subscription( $subscription ) ) {
			return [];
		}

		if ( ! is_a( $subscription, 'WC_Subscription' ) ) {
			$subscription = \wcs_get_subscription( $subscription );
		}

		/**
		 * Filter the managers of a group subscription.
		 * Currently this is only the subscription owner.
		 *
		 * @param int[] $member_ids The group manager user IDs.
		 * @param WC_Subscription $subscription The subscription object.
		 */
		return apply_filters( 'newspack_group_subscription_managers', [ $subscription->get_user_id() ], $subscription );
	}

	/**
	 * Get the members of a group subscription.
	 *
	 * @param WC_Subscription|int $subscription The subscription object or ID.
	 *
	 * @return int[] Array of user IDs for the group subscription members.
	 */
	public static function get_members( $subscription ) {
		if ( ! self::is_group_subscription( $subscription ) ) {
			return [];
		}
		if ( ! is_a( $subscription, 'WC_Subscription' ) ) {
			$subscription = \wcs_get_subscription( $subscription );
		}
		$subscription_id = $subscription->get_id();
		$members         = array_map(
			function( $user ) {
				return $user->ID;
			},
			\get_users(
				[
					'fields'     => [ 'ID' ],
					'meta_query' => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
						[
							'key'   => self::GROUP_SUBSCRIPTION_USER_META_KEY,
							'value' => $subscription_id,
						],
					],
				]
			)
		);

		/**
		 * Filter the members of a group subscription.
		 *
		 * @param int[] $members Array of user IDs for group subscription members.
		 * @param WC_Subscription $subscription The subscription object.
		 */
		return apply_filters( 'newspack_group_subscription_members', $members, $subscription );
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
		 * @param WC_Subscription|int $subscription The subscription object or ID.
		 */
		return apply_filters( 'newspack_group_subscription_user_can_access', $can_access, $user_id, $subscription );
	}

	/**
	 * Get the group subscriptions a user is a member of.
	 * Group membership is represented as a repeatable user meta key with the subscription IDs the value.
	 *
	 * @param int      $user_id The user ID.
	 * @param bool     $ids_only If true, return only the subscription IDs instead of the subscription objects.
	 * @param string[] $subscription_statuses The statuses of the subscriptions to return.
	 *
	 * @return WC_Subscription[] The group subscriptions the user is a member of.
	 */
	public static function get_group_subscriptions_for_user( $user_id, $ids_only = false, $subscription_statuses = [ 'active', 'pending-cancel' ] ) {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return [];
		}
		if ( ! Reader_Activation::is_user_reader( \get_user_by( 'id', $user_id ) ) ) {
			return [];
		}
		$subscription_ids = array_map( 'absint', \get_user_meta( $user_id, self::GROUP_SUBSCRIPTION_USER_META_KEY, false ) );
		$subscriptions    = $ids_only ? $subscription_ids : [];
		if ( ! $ids_only ) {
			foreach ( $subscription_ids as $subscription_id ) {
				$subscription = \wcs_get_subscription( $subscription_id );
				if ( $subscription && $subscription->has_status( $subscription_statuses ) ) {
					$subscriptions[] = $subscription;
				}
			}
		}

		/**
		 * Filter the group subscriptions a user is a member of.
		 *
		 * @param WC_Subscription[]|int[] $subscriptions The group subscriptions or IDs the user is a member of.
		 * @param int $user_id The user ID.
		 * @param string[] $subscription_statuses The statuses of the subscriptions to return.
		 */
		return apply_filters( 'newspack_group_subscriptions_for_user', $subscriptions, $user_id, $subscription_statuses );
	}
}
Group_Subscriptions::init();
