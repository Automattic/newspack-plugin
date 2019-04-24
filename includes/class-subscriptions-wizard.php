<?php
/**
 * Newspack subscriptions setup and management.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for managing subscriptions.
 */
class Subscriptions_Wizard extends Wizard {

	protected $name = 'Newspack: Subscriptions';
	protected $slug = 'newspack-subscriptions-wizard';
	protected $capability = 'edit_products';

	/**
	 * Initialize.
	 */
	public function __construct() {
		$this->init();
		add_action( 'admin_init', [ $this, 'save_product_form' ] );
	}

	protected function get_home_screen() {
		return 'manage_subscriptions';
	}

	protected function render_manage_subscriptions_screen() {
		$products = $this->get_subscriptions();

		?>
		<div class="newspack-wizard__heading">
			<h1><?php echo esc_html__( 'Subscriptions', 'newspack' ); ?></h1>
			<p><?php echo esc_html__( 'Add subscription plans and manage your subscription plans.', 'newspack' ); ?></p>
		</div>

		<div class="newspack-wizard__manage-subscriptions">
			<?php
			foreach ( $products as $product ) {
				include 'views/subscriptions-wizard/product-details.php';
			}
			?>
		</div>

		<a class="newspack-wizard__cta" href="<?php echo self_admin_url( 'index.php?page=newspack-subscriptions-wizard&screen=edit_subscription' ) ?>">Add a subscription</a>
		<?php
	}

	protected function render_edit_subscription_screen() {
		$product = isset( $_GET['subscription'] ) ? wc_get_product( absint( $_GET['subscription'] ) ) : false;
		$heading = $product ? __( 'Edit your subscription', 'newspack' ) : __( 'Add a subscription', 'newspack' );
		?>
		<div class="newspack-wizard__heading">
			<h1><?php echo esc_html( $heading ); ?></h1>
		</div>

		<div class="newspack-wizard__edit-subscription newspack-card">
			<?php include 'views/subscriptions-wizard/edit-product.php'; ?>
		</div>
		<?php
	}

	protected function get_subscriptions() {
		return wc_get_products([
			'status'  => 'publish',
			'limit'   => -1,
			'virtual' => true,
		]);
	}

	public function save_product_form() {
		if ( ! isset( $_GET['page'], $_POST['save_product_form'] ) || 'newspack-subscriptions-wizard' !== $_GET['page'] || ! $_POST['save_product_form'] ) {
			return;
		}

		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( __( 'Sorry, you are not allowed to manage subscriptions for this site.', 'newspack' ) );
		}

		check_admin_referer( 'newspack-subscriptions-wizard-edit-subscription' );

		$defaults = [
			'id' => 0,
			'name' => '',
			'image_id' => 0,
			'price' => 0.0,
			'subscription_frequency' => 'once',
			'choose_price' => false,
			'suggested_price' => 0.0,
			'suggested_min_price' => 0.0,
			'suggested_max_price' => 0.0,
			'hide_minimum_price' => false,
		];
		$args = wp_parse_args( $_POST, $defaults );
		$args['id'] = absint( $args['id'] );
		$args['name'] = sanitize_text_field( wp_unslash( $args['name'] ) );
		$args['image_id'] = absint( $args['image_id'] );
		$args['price'] = wc_format_decimal( $args['price'] );
		$args['subscription_frequency'] = sanitize_title( wp_unslash( $args['subscription_frequency'] ) );
		$args['choose_price'] = $args['choose_price'] ? true : false;
		$args['suggested_price'] = wc_format_decimal( $args['suggested_price'] );
		$args['suggested_min_price'] = wc_format_decimal( $args['suggested_min_price'] );
		$args['suggested_max_price'] = wc_format_decimal( $args['suggested_max_price'] );
		$args['hide_minimum_price'] = $args['hide_minimum_price'] ? true : false;

		$this->save_product( $args );
	}

	protected function save_product( $args ) {
		$defaults = [
			'id' => 0,
			'name' => '',
			'image_id' => 0,
			'price' => 0.0,
			'subscription_frequency' => 'once',
			'choose_price' => false,
			'suggested_price' => 0.0,
			'suggested_min_price' => 0.0,
			'suggested_max_price' => 0.0,
			'hide_minimum_price' => false,
		];

		$args = wp_parse_args( $args, $defaults );

		if ( 'once' === $args['subscription_frequency'] ) {
			$product = new \WC_Product_Simple( $args['id'] );
		} else {
			$product = new \WC_Product_Subscription( $args['id'] );
		}

		$product->set_name( $args['name'] );
		$product->set_virtual( true );

		// Set One-Page Checkout on for this product.
		$product->update_meta_data( '_wcopc', true );
		
		// @todo set image.

		if ( $args['choose_price'] ) {
			// Set Name Your Price on for this product.
			$product->update_meta_data( '_nyp', 'yes', true );

			$product->update_meta_data( '_min_price', wc_format_decimal( $args['suggested_min_price'] ) );
			if ( $args['suggested_max_price'] ) {
				$product->update_meta_data( '_maximum_price', wc_format_decimal( $args['suggested_max_price'] ) );
			}
			$product->update_meta_data( '_hide_nyp_minimum', true === $args['hide_minimum_price'] ? 'yes' : 'no' );
			$product->update_meta_data( '_suggested_price', wc_format_decimal( $args['suggested_price'] ) );
		} else {
			$product->set_regular_price( wc_format_decimal( $args['price'] ) );
		}

		if ( 'once' !== $args['subscription_frequency'] ) {
			$product->update_meta_data( '_subscription_price', wc_format_decimal( $args['price'] ) );
			$product->update_meta_data( '_subscription_period', 'month' === $args['subscription_frequency'] ? 'month' : 'year' );
			$product->update_meta_data( '_subscription_period_interval', 1 );
		}

		$product->save();
	}
}
new Subscriptions_Wizard();
