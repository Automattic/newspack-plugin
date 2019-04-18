<?php
/**
 * Newspack subscriptions/memberships setup.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the API as a whole.
 */
class Memberships_Wizard {

	protected $required_plugins = [ 'woocommerce', 'woocommerce-subscriptions', 'woocommerce-name-your-price', 'woocommerce-one-page-checkout', 'woocommerce-gateway-stripe' ];

	/**
	 * Initialize.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_dashboard_page' ] );
	}

	public function add_dashboard_page() {
		add_dashboard_page( 'Newspack Memberships Wizard', 'Newspack Memberships Wizard', 'manage_options', 'newspack-memberships-wizard', [ $this, 'render_wizard' ] );
	}

	public function render_wizard() {
		$step = isset( $_GET['step'] ) && $_GET['step'] ? sanitize_title( $_GET['step'] ) : 'start';
		$render_method = 'render_' . $step . '_step';
		$this->$render_method();
	}

	protected function render_start_step() {
		?><h1>STEP 1: Install and activate plugins</h1><?php
		$managed_plugins = Plugin_Manager::get_managed_plugins();

		$uninstalled = [];
		$inactive = [];

		?><h2>Required plugins:</h2><?php
		foreach ( $this->required_plugins as $required_plugin ) {
			$plugin_info = $managed_plugins[ $required_plugin ];

			if ( 'uninstalled' === $plugin_info['status'] ) {
				$uninstalled[] = $required_plugin;
			} elseif ( 'inactive' === $plugin_info['status'] ) {
				$inactive[] = $required_plugin;
			}
			?>
			<div>
				<?php echo esc_html( $plugin_info['name'] ); ?>: 
				<?php echo esc_html( $plugin_info['status'] ); ?>
			</div>
			<?php
		}

		if ( ! empty( $uninstalled ) ) {
			?>
			<p>The following plugins need to be installed before you can continue: <?php echo implode( ', ', $uninstalled ); ?></p>
			<?php
		} elseif ( ! empty ( $inactive ) ) {
			?>
			<p>The following plugins are inactive and will be activated if you continue: <?php echo implode( ', ', $inactive ); ?></p>
			<?php
		}

		if ( empty( $uninstalled ) ) {
			$url = self_admin_url( 'index.php?page=newspack-memberships-wizard&step=activate' );
			?>
			<h3><a href=<?php echo $url ?>>Continue</a></h3>
			<?php
		}
	}

	protected function render_activate_step() {
		?><h1>Plugins activated</h1><?php

		foreach ( $this->required_plugins as $required_plugin ) {
			Plugin_Manager::activate( $required_plugin );
		}

		$url = self_admin_url( 'index.php?page=newspack-memberships-wizard&step=config' );
		?>
		<h3><a href=<?php echo $url ?>>Continue</a></h3>
		<?php
	}

	protected function render_config_step() {
		?><h1>Step 2: Config</h1><?php

	}

	protected function setup_options( $args ) {
		// turn off reviews
		// turn off coupons
		// do address
		// set up stripe
	}

	protected function create_products( $products_args ) {
		$product_defaults = [
			'name' => '',
			'price' => 0.0,
			'choose_price' => true,
			'frequency' => 'once'
		];

		foreach ( $products_args as $product_args ) {
			$product_args = wp_parse_args( $product_args, $product_defaults );
			if ( 'once' === $product_args['frequency'] ) {
				$this->create_one_time_donation_product( $product_args );
			} else {
				$this->create_recurring_donation_product( $product_args );
			}
		}
	}

	protected function create_one_time_donation_product( $args ) {
		$product = new \WC_Product_Simple();
		$product->set_name( $args['name'] );
		$product->set_virtual( true );
		// set one page checkout

		if ( $args['choose_price'] ) {
			$product->add_meta_data( '_nyp', 'yes', true );
			$product->add_meta_data( '_min_price', 1.0, true );
			$product->add_meta_data( '_hide_nyp_minimum', 'yes', true );

			if ( $args['price'] ) {
				$product->add_meta_data( '_suggested_price', $args['price'], true );
			}
		} else {
			$product->set_regular_price( $args['price'] );
		}

		$product->save();
	}

	protected function create_recurring_donation_product( $args ) {

	}

	protected function create_landing_page() {

	}

}
new Memberships_Wizard();
