<?php
/**
 * WooCommerce Subscriptions Integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class WooCommerce_Subscriptions {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'plugins_loaded', [ __CLASS__, 'woocommerce_subscriptions_integration_init' ] );
		add_action( 'wp_footer', [ __CLASS__, 'render_subscription_tiers_modal' ] );
	}

	/**
	 * Initialize WooCommerce Subscriptions Integration.
	 */
	public static function woocommerce_subscriptions_integration_init() {
		include_once __DIR__ . '/class-on-hold-duration.php';
		include_once __DIR__ . '/class-renewal.php';
		include_once __DIR__ . '/class-subscriptions-meta.php';
		include_once __DIR__ . '/class-subscriptions-confirmation.php';

		On_Hold_Duration::init();
		Renewal::init();
		Subscriptions_Meta::init();
		Subscriptions_Confirmation::init();
	}


	/**
	 * Check if WooCommerce Subscriptions is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return function_exists( 'WC' ) && class_exists( 'WC_Subscriptions' );
	}

	/**
	 * Check if WooCommerce Subscriptions Integration is enabled.
	 *
	 * True if:
	 * - WooCommerce Subscriptions is active and,
	 * - Reader Activation is enabled and,
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$is_enabled = self::is_active() && Reader_Activation::is_enabled();
		/**
		 * Filters whether subscriptions expiration is enabled.
		 *
		 * @param bool $is_enabled
		 */
		return apply_filters( 'newspack_subscriptions_expiration_enabled', $is_enabled );
	}

	/**
	 * Get tiered subscription products by frequency.
	 *
	 * @return array
	 */
	public static function get_tiers_by_frequency() {
		if ( ! function_exists( 'wc_get_products' ) || ! function_exists( 'wcs_user_has_subscription' ) ) {
			return [];
		}

		$products = wc_get_products(
			[
				'type'  => [
					'subscription',
					'variable-subscription',
				],
				'limit' => -1,
			]
		);

		foreach ( $products as $i => $product ) {
			// Always exclude donation products.
			if ( Donations::is_donation_product( $product->get_id() ) ) {
				unset( $products[ $i ] );
				continue;
			}
			// Use the variations if it's a variable product.
			if ( $product->is_type( 'variable' ) ) {
				unset( $products[ $i ] );
				$variations = $product->get_available_variations();
				foreach ( $variations as $variation ) {
					$products[] = new \WC_Product_Variation( $variation['variation_id'] );
				}
			}
		}

		$products = array_values( $products );

		$products_by_frequency = [];
		foreach ( $products as $product ) {
			$frequency = $product->get_meta( '_subscription_period' );
			if ( ! $frequency ) {
				continue;
			}
			$products_by_frequency[ $frequency ][] = [
				'id'         => $product->get_id(),
				'name'       => $product->get_name(),
				'price'      => $product->get_price(),
				'price_html' => $product->get_price_html(),
				'owned'      => wcs_user_has_subscription( get_current_user_id(), $product->get_id(), 'active' ),
			];
		}
		// Sort by price.
		foreach ( $products_by_frequency as $frequency => $products ) {
			usort(
				$products,
				function( $a, $b ) {
					return intval( $a['price'] ) <=> intval( $b['price'] );
				}
			);
			$products_by_frequency[ $frequency ] = $products;
		}

		return $products_by_frequency;
	}

	/**
	 * Get the label for a frequency.
	 *
	 * @param string $frequency Frequency.
	 *
	 * @return string
	 */
	private static function get_frequency_label( $frequency ) {
		$frequencies = [
			'month' => __( 'Monthly', 'newspack-plugin' ),
			'year'  => __( 'Yearly', 'newspack-plugin' ),
		];
		return $frequencies[ $frequency ] ?? $frequency;
	}

	/**
	 * Render subscription tiers modal.
	 */
	public static function render_subscription_tiers_modal() {
		$tiers = self::get_tiers_by_frequency();
		if ( empty( $tiers ) ) {
			return;
		}
		$frequencies       = array_keys( $tiers );
		$current_frequency = null;
		foreach ( $frequencies as $frequency ) {
			foreach ( $tiers[ $frequency ] as $product ) {
				if ( $product['owned'] ) {
					$current_frequency = $frequency;
					break 2;
				}
			}
		}
		?>
		<div id="newspack__subscription-tiers" class="newspack-ui newspack-ui__modal-container" data-state="closed">
			<div class="newspack-ui__modal-container__overlay"></div>
			<div class="newspack-ui__modal newspack-ui__modal--small">
				<header class="newspack-ui__modal__header">
					<h2><?php _e( 'Change Subscription', 'newspack-plugin' ); ?></h2>
					<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close">
						<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
						<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
					</button>
				</header>

				<form class="newspack-ui__modal__content">
					<div class="newspack-ui__segmented-control">
						<div class="newspack-ui__segmented-control__tabs">
							<?php foreach ( $frequencies as $frequency ) : ?>
								<button class="newspack-ui__button newspack-ui__button--small <?php echo esc_attr( $frequency === $current_frequency ? 'selected' : '' ); ?>"><?php echo esc_html( self::get_frequency_label( $frequency ) ); ?></button>
							<?php endforeach; ?>
						</div>
						<div class="newspack-ui__segmented-control__content">
							<?php foreach ( $tiers as $frequency => $products ) : ?>
								<div class="newspack-ui__segmented-control__panel">
									<?php foreach ( $products as $product ) : ?>
										<label class="newspack-ui__input-card">
											<?php if ( $product['owned'] ) : ?>
												<span class="newspack-ui__badge newspack-ui__badge--primary"><?php _e( 'Current', 'newspack-plugin' ); ?></span>
											<?php endif; ?>
											<input type="radio" name="subscription-tier" value="<?php echo esc_attr( $product['id'] ); ?>" <?php echo esc_attr( $product['owned'] ? 'checked' : '' ); ?>>
											<strong><?php echo esc_html( $product['name'] ); ?></strong>
											<span class="newspack-ui__helper-text"><?php echo $product['price_html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
										</label>
									<?php endforeach; ?>
								</div>
							<?php endforeach; ?>
						</div>
					</div>
					<button type="submit" class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide">Change Subscription</button>
					<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__cancel">Cancel</button>
				</form>
			</div>
		</div>
		<?php
	}
}
WooCommerce_Subscriptions::init();
