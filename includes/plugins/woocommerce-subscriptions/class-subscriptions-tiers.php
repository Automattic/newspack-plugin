<?php
/**
 * Subscription tiers functionality for WooCommerce Subscriptions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Subscriptions_Tiers {
	/**
	 * Switch subscription links rendered in the page.
	 *
	 * @var array
	 */
	private static $switch_subscription_links = [];

	/**
	 * Initialize hooks.
	 */
	public static function init_hooks() {
		add_filter( 'woocommerce_subscriptions_switch_link_text', [ __CLASS__, 'cache_switch_subscription_link_data' ], 10, 4 );
		add_action( 'wp_footer', [ __CLASS__, 'print_switch_subscription_modal' ] );

		// Order button text.
		add_filter( 'wcs_place_subscription_order_text', [ __CLASS__, 'order_button_text' ], 9 );
		add_filter( 'woocommerce_order_button_text', [ __CLASS__, 'order_button_text' ], 9 );
		add_filter( 'option_woocommerce_subscriptions_order_button_text', [ __CLASS__, 'order_button_text' ], 9 );

		// Primary product rendering.
		add_action( 'wp_footer', [ __CLASS__, 'print_primary_product_modal' ] );
	}

	/**
	 * Store switch subscription links in memory so we can render the modal later.
	 *
	 * @param string           $text         The text of the switch subscription link.
	 * @param int              $item_id      The ID of the item.
	 * @param array            $item         The order line item data.
	 * @param \WC_Subscription $subscription The subscription.
	 *
	 * @return string The text of the switch subscription link.
	 */
	public static function cache_switch_subscription_link_data( $text, $item_id, $item, $subscription ) {
		self::$switch_subscription_links[ $item_id ] = [
			'item_id'      => $item_id,
			'item'         => $item,
			'subscription' => $subscription,
		];
		return $text;
	}

	/**
	 * Modal switch subscription template.
	 */
	public static function print_switch_subscription_modal() {
		if ( empty( self::$switch_subscription_links ) ) {
			return;
		}
		foreach ( self::$switch_subscription_links as $data ) {
			$product = wc_get_product( $data['item']['product_id'] );
			if ( ! $product ) {
				continue;
			}
			$parent_products = \WC_Subscriptions_Product::get_visible_grouped_parent_product_ids( $product );
			if ( empty( $parent_products ) ) {
				continue;
			}
			$product = wc_get_product( reset( $parent_products ) );
			self::render_modal( $product, __( 'Change Subscription', 'newspack-plugin' ), __( 'Change Subscription', 'newspack-plugin' ), $data );
		}
	}

	/**
	 * Get the primary subscription tier product.
	 *
	 * @return \WC_Product|null Product or null if no product is set.
	 */
	public static function get_primary_subscription_tier_product() {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		$product = get_option( 'newspack_subscriptions_primary_subscription_tier_product' );
		if ( ! $product ) {
			return null;
		}
		return wc_get_product( $product );
	}

	/**
	 * Set the primary subscription tier product.
	 *
	 * @param \WC_Product $product Product.
	 */
	public static function set_primary_subscription_tier_product( $product ) {
		update_option( 'newspack_subscriptions_primary_subscription_tier_product', $product->get_id() );
	}

	/**
	 * Get all subscription products that are eligible for tier configuration.
	 *
	 * @return \WC_Product[] Products.
	 */
	public static function get_tier_eligible_products() {
		if ( ! function_exists( 'wc_get_products' ) ) {
			return [];
		}

		$products = wc_get_products(
			[
				'type'  => [ 'grouped', 'variable-subscription' ],
				'limit' => -1,
			]
		);

		// Filter out donation products.
		$products = array_filter(
			$products,
			function( $product ) {
				return ! Donations::is_donation_product( $product->get_id() );
			}
		);

		// Filter out grouped products that don't have any subscription products.
		$products = array_filter(
			$products,
			function( $product ) {
				if ( $product->is_type( 'grouped' ) ) {
					$children = $product->get_children();
					foreach ( $children as $child ) {
						$child = wc_get_product( $child );
						if ( ! $child ) {
							continue;
						}
						if ( $child->is_type( 'subscription' ) || $child->is_type( 'variable-subscription' ) ) {
							return true;
						}
					}
					return false;
				}
				return true;
			}
		);

		return array_values( $products );
	}

	/**
	 * Get tiered products by frequency given a grouped or
	 * variable subscription product.
	 *
	 * If no product is provided, it will use all
	 * non-donation subscription products.
	 *
	 * @param \WC_Product|null $product       Optional product.
	 * @param bool|null        $sort_by_price Whether to sort by price.
	 *
	 * @return array<string, \WC_Product[]> Product tiers by frequency.
	 */
	public static function get_tiers_by_frequency( $product = null, $sort_by_price = null ) {
		if ( ! function_exists( 'wc_get_products' ) || ! function_exists( 'wcs_user_has_subscription' ) ) {
			return [];
		}

		if ( empty( $product ) ) {
			$products = wc_get_products(
				[
					'type'  => [ 'subscription', 'variable-subscription' ],
					'limit' => -1,
				]
			);
			$sort_by_price = $sort_by_price ?? true;
		} elseif ( $product->is_type( 'grouped' ) ) {
			$products = $product->get_children();
			$sort_by_price = $sort_by_price ?? false;
		} elseif ( $product->is_type( 'variable' ) || $product->is_type( 'variable_subscription' ) || $product->is_type( 'subscription' ) ) {
			$products = [ $product ];
			$sort_by_price = $sort_by_price ?? true;
		}

		if ( empty( $products ) ) {
			return [];
		}

		$selected_products = [];

		foreach ( $products as $product ) {
			if ( is_int( $product ) ) {
				$product = wc_get_product( $product );
			}

			if ( ! in_array( $product->get_type(), [ 'subscription', 'variable-subscription' ], true ) ) {
				continue;
			}

			// Exclude donation products.
			if ( Donations::is_donation_product( $product->get_id() ) ) {
				continue;
			}

			// Extract the variations if it's a variable product.
			if ( $product->is_type( 'variable' ) ) {
				$variations = $product->get_available_variations();
				foreach ( $variations as $variation ) {
					$selected_products[] = new \WC_Product_Variation( $variation['variation_id'] );
				}
			} else {
				$selected_products[] = $product;
			}
		}

		$products_by_frequency = [];
		foreach ( $selected_products as $product ) {
			$frequency = $product->get_meta( '_subscription_period' );
			if ( ! $frequency ) {
				continue;
			}
			$products_by_frequency[ $frequency ][] = $product;
		}

		if ( $sort_by_price ) {
			foreach ( $products_by_frequency as $frequency => $products ) {
				usort(
					$products,
					function( $a, $b ) {
						return intval( $a->get_price() ) <=> intval( $b->get_price() );
					}
				);
				$products_by_frequency[ $frequency ] = $products;
			}
		}

		return $products_by_frequency;
	}

	/**
	 * Get product title.
	 *
	 * @param \WC_Product $product                   Product.
	 * @param bool        $show_variation_attributes Whether the product title should include the variation attributes.
	 *
	 * @return string Product title.
	 */
	private static function get_product_title( $product, $show_variation_attributes = false ) {
		$product_name = $product->get_title();
		if ( $product->is_type( 'variation' ) ) {
			if ( $show_variation_attributes ) {
				$product_name = sprintf(
					'%s (%s)',
					$product_name,
					implode( ', ', $product->get_variation_attributes() )
				);
			}
		}
		return $product_name;
	}

	/**
	 * Render a subscription product card.
	 *
	 * @param \WC_Product $product                   Product.
	 * @param bool        $show_variation_attributes Whether the card should render the product variation attributes.
	 * @param bool        $current                   Whether the product should have the "current" badge.
	 * @param bool        $selected                  Whether the product should be checked.
	 */
	private static function render_product_card( $product, $show_variation_attributes = false, $current = false, $selected = false ) {
		if ( function_exists( 'wcs_price_string' ) ) {
			$price = wcs_price_string(
				[
					'recurring_amount'      => $product->get_price(),
					'subscription_period'   => $product->get_meta( '_subscription_period' ),
					'subscription_interval' => $product->get_meta( '_subscription_period_interval' ),
				]
			);
		} else {
			$price = $product->get_price_html();
		}

		?>
		<label class="newspack-ui__input-card <?php echo $current ? esc_attr( 'current' ) : ''; ?>">
			<?php if ( $current ) : ?>
				<span class="newspack-ui__badge newspack-ui__badge--primary"><?php _e( 'Current', 'newspack-plugin' ); ?></span>
			<?php endif; ?>
			<input type="radio" name="product_id" value="<?php echo esc_attr( $product->get_id() ); ?>" <?php echo esc_attr( $selected ? 'checked' : '' ); ?>>
			<strong><?php echo esc_html( self::get_product_title( $product, $show_variation_attributes ) ); ?></strong>
			<span class="newspack-ui__helper-text"><?php echo $price; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
		</label>
		<?php
	}

	/**
	 * Render existing subscription info.
	 *
	 * @param \WC_Product      $product      Product.
	 * @param \WC_Subscription $subscription Subscription.
	 */
	public static function render_existing_subscription_info( $product, $subscription ) {
		?>
		<div class="newspack-ui__notice newspack-ui__notice--warning">
			<span class="newspack-ui__notice__content">
				<?php
				printf(
					/* translators: %s: subscription product name */
					esc_html__( 'You already have %s active.', 'newspack-plugin' ),
					wp_kses_post( '<strong>' . self::get_product_title( $product, true ) . '</strong>' )
				);
				?>
			</span>
		</div>
		<a class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide" href="<?php echo esc_url( $subscription->get_view_order_url() ); ?>" aria-label="<?php esc_attr_e( 'View Subscription', 'newspack-plugin' ); ?>">
			<?php esc_html_e( 'View', 'newspack-plugin' ); ?>
		</a>
		<?php
	}

	/**
	 * Get the user's subscription within a grouped or variable subscription product.
	 *
	 * @param \WC_Product $product Product.
	 * @param int|null    $user_id User ID. Defaults to the current user.
	 *
	 * @return \WC_Subscription|null Subscription or null if the user does not have a subscription.
	 */
	public static function get_user_subscription( $product, $user_id = null ) {
		if ( ! function_exists( 'wcs_get_users_subscriptions' ) || ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		$user_id = $user_id ?? get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$products           = $product->get_children();
		$user_subscriptions = wcs_get_users_subscriptions( $user_id );

		foreach ( $products as $product ) {
			$product = wc_get_product( $product );
			if ( ! $product ) {
				continue;
			}
			foreach ( $user_subscriptions as $subscription ) {
				if ( $subscription->has_product( $product->get_id() ) && $subscription->has_status( 'active' ) ) {
					return $subscription;
				}
			}
		}

		return null;
	}

	/**
	 * Render subscription tiers form.
	 *
	 * @param \WC_Product $product             Optional product.
	 * @param string|null $title               Optional title.
	 * @param string|null $button_label        Optional button label.
	 * @param array|null  $switch_subscription Switch subscription data or null.
	 */
	public static function render_form( $product = null, $title = null, $button_label = null, $switch_subscription = null ) {
		$tiers = self::get_tiers_by_frequency( $product );
		if ( empty( $tiers ) ) {
			return;
		}

		// Determine whether there's only 1 item per frequency so we can render a
		// single tier modal.
		$is_single_tier = array_reduce(
			$tiers,
			function( $carry, $frequency ) {
				return $carry && count( $frequency ) === 1;
			},
			true
		);

		$frequencies       = array_keys( $tiers );
		$current_frequency = null;
		$current_product   = null;
		$user_subscription = null;
		if ( is_user_logged_in() ) {
			$user_subscriptions = wcs_get_users_subscriptions( get_current_user_id() );
			foreach ( $frequencies as $frequency ) {
				foreach ( $tiers[ $frequency ] as $product ) {
					foreach ( $user_subscriptions as $subscription ) {
						if ( $subscription->has_product( $product->get_id() ) && $subscription->has_status( 'active' ) ) {
							$current_frequency = $frequency;
							$current_product   = $product;
							$user_subscription = $subscription;
							break 2;
						}
					}
				}
			}
		}

		if ( ! $current_frequency ) {
			$current_frequency = $frequencies[0];
		}

		if ( $current_product ) {
			$selected_product = $current_product;
		} else {
			$selected_product = $tiers[ $current_frequency ][0];
		}

		$title        = $title ?? __( 'Complete your transaction', 'newspack-plugin' );
		$button_label = $button_label ?? __( 'Purchase', 'newspack-plugin' );

		$action_type = ! empty( $switch_subscription ) ? 'switch_subscription' : '';

		// If the user has an active subscription and this is not a switch, render
		// the existing subscription info instead of the tiers form.
		if ( $user_subscription && empty( $switch_subscription ) ) {
			self::render_existing_subscription_info( $current_product, $user_subscription );
			return;
		}

		?>
		<form class="newspack__subscription-tiers__form" target="newspack_modal_checkout_iframe" data-title="<?php echo esc_attr( $title ); ?>">
			<?php if ( ! $is_single_tier ) : ?>
				<div class="newspack-ui__segmented-control">
					<?php if ( count( $frequencies ) > 1 ) : ?>
						<div class="newspack-ui__segmented-control__tabs">
							<?php foreach ( $frequencies as $frequency ) : ?>
								<button type="button" class="newspack-ui__button newspack-ui__button--small <?php echo esc_attr( $frequency === $current_frequency ? 'selected' : '' ); ?>"><?php echo esc_html( WooCommerce_Subscriptions::get_frequency_label( $frequency ) ); ?></button>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
					<div class="newspack-ui__segmented-control__content">
						<?php foreach ( $tiers as $frequency => $products ) : ?>
							<div class="newspack-ui__segmented-control__panel">
								<?php
								foreach ( $products as $product ) {
									self::render_product_card( $product, false, $product === $current_product, $product === $selected_product );
								}
								?>
							</div>
						<?php endforeach; ?>
					</div>
				</div>
			<?php endif; ?>
			<?php
			if ( $is_single_tier ) {
				foreach ( $tiers as $products ) {
					foreach ( $products as $product ) {
						self::render_product_card( $product, true, $product === $current_product, $product === $selected_product );
					}
				}
			}
			?>
			<input type="hidden" name="newspack_checkout" value="1">
			<input type="hidden" name="modal_checkout" value="1">
			<?php if ( ! empty( $switch_subscription ) ) : ?>
				<input type="hidden" name="switch-subscription" value="<?php echo esc_attr( $switch_subscription['subscription']->get_id() ); ?>">
				<input type="hidden" name="item" value="<?php echo absint( $switch_subscription['item_id'] ); ?>">
			<?php endif; ?>

			<button type="submit" class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"><?php echo esc_html( $button_label ); ?></button>
			<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__cancel"><?php _e( 'Cancel', 'newspack-plugin' ); ?></button>
		</form>
		<?php
	}

	/**
	 * Render subscription tiers modal given a grouped or variable
	 * subscription product.
	 *
	 * If no grouped or variable subscription product is provided,
	 * all non-donation subscription products are rendered.
	 *
	 * @param \WC_Product|null $product             Optional product.
	 * @param string|null      $title               Optional title.
	 * @param string|null      $button_label        Optional button label.
	 * @param array|null       $switch_subscription Switch subscription data or null.
	 * @param string           $initial_state       Optional initial state.
	 */
	public static function render_modal( $product = null, $title = null, $button_label = null, $switch_subscription = null, $initial_state = 'closed' ) {
		?>
		<div class="newspack-ui newspack-ui__modal-container newspack__subscription-tiers" data-state="<?php echo esc_attr( $initial_state ); ?>" data-product-id="<?php echo esc_attr( $product ? $product->get_id() : '' ); ?>" data-subscription-id="<?php echo esc_attr( $switch_subscription ? $switch_subscription['subscription']->get_id() : '' ); ?>">
			<div class="newspack-ui__modal-container__overlay"></div>
			<div class="newspack-ui__modal newspack-ui__modal--small">
				<header class="newspack-ui__modal__header">
					<h2><?php echo esc_html( $title ?? __( 'Complete your transaction', 'newspack-plugin' ) ); ?></h2>
					<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close">
						<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
						<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
					</button>
				</header>
				<div class="newspack-ui__modal__content">
					<?php self::render_form( $product, $title, $button_label, $switch_subscription ); ?>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Order button text.
	 *
	 * @param string $text The text of the order button.
	 *
	 * @return string The text of the order button.
	 */
	public static function order_button_text( $text ) {
		if ( method_exists( 'WC_Subscriptions_Switcher', 'cart_contains_switches' ) && \WC_Subscriptions_Switcher::cart_contains_switches( 'any' ) ) {
			return __( 'Change Subscription', 'newspack-plugin' );
		}
		return $text;
	}

	/**
	 * Render primary product modal.
	 */
	public static function print_primary_product_modal() {
		$product = self::get_primary_subscription_tier_product();
		if ( ! $product ) {
			return;
		}
		if ( empty( $_GET['upgrade_subscription'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$title             = sanitize_text_field( $_GET['upgrade_subscription'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$user_subscription = self::get_user_subscription( $product );

		self::render_modal( $product, $title, $title, $user_subscription, 'open' );
	}
}
Subscriptions_Tiers::init_hooks();
