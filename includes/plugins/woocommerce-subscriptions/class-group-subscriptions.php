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
	 * Initialize hooks and filters.
	 */
	public static function init() {
		// Add Group Subscription options to subscription and variable subscription product admin pages.
		add_filter( 'newspack_custom_product_options', [ __CLASS__, 'add_custom_product_options' ] );
		add_filter( 'newspack_custom_product_pricing_options', [ __CLASS__, 'add_custom_product_pricing_options' ] );

		// Add Group Subscription options to subscription admin pages.
		add_action( 'add_meta_boxes', [ __CLASS__, 'add_group_subscription_meta_box' ], 20, 2 );
		add_action( 'woocommerce_process_shop_order_meta', [ __CLASS__, 'save_group_subscription_meta' ], 10, 2 );
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
		return $settings;
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
		$settings['enabled'] = $subscription->get_meta( '_newspack_group_subscription_enabled', true ) ? \wc_string_to_bool( $subscription->get_meta( '_newspack_group_subscription_enabled', true ) ) : $settings['enabled'];
		$settings['limit']   = (int) $subscription->get_meta( '_newspack_group_subscription_limit', true ) ?: $settings['limit']; // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
		return $settings;
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
			__( 'Group Subscription settings', 'newspack-plugin' ),
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
		<?php
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
		$is_enabled        = isset( $_POST['_newspack_group_subscription_enabled'] ) ? true : false;
		$limit             = isset( $_POST['_newspack_group_subscription_limit'] ) ? absint( $_POST['_newspack_group_subscription_limit'] ) : 0;
		$should_save       = false;

		if ( $is_enabled !== $previous_settings['enabled'] ) {
			$subscription->update_meta_data( '_newspack_group_subscription_enabled', \wc_bool_to_string( $is_enabled ) );
			$should_save = true;
		}
		if ( $limit !== $previous_settings['limit'] ) {
			$subscription->update_meta_data( '_newspack_group_subscription_limit', absint( $_POST['_newspack_group_subscription_limit'] ) );
			$should_save = true;
		}
		if ( $should_save ) {
			$subscription->save();
		}
	}
}
Group_Subscriptions::init();
