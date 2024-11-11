<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.ClassComment.Missing, Squiz.Commenting.VariableComment.Missing, Squiz.Commenting.FileComment.Missing, Generic.Files.OneObjectStructurePerFile.MultipleFound, Universal.Files.SeparateFunctionsFromOO.Mixed

class WC_Install {
	public static function create_pages() {
		return true;
	}
}

class WC_Gateway_Stripe {
	public $enabled         = 'yes';
	private static $options = [];
	public function update_option( $key, $value ) {
		self::$options[ $key ] = $value;
	}
	public static function get_option( $key ) {
		if ( isset( self::$options[ $key ] ) ) {
			return self::$options[ $key ];
		}
		return null;
	}
	public static function reset_testing_options() {
		self::$options = [];
	}
}

class WC_Stripe {
	protected static $instance = null;
	public $connect = null;
	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
			self::$instance->connect = self::$instance;
		}
		return self::$instance;
	}
	public function is_connected( $mode = 'live' ) {
		return false;
	}
	public function is_connected_via_oauth( $mode = 'live' ) {
		return false;
	}
}

class WC_Stripe_Feature_Flags {
	public static function is_upe_checkout_enabled() {
		return true;
	}
}

class WC_Payment_Gateways {
	private static $gateways = [];
	public static function instance() {
		return new WC_Payment_Gateways();
	}
	public function init() {
		self::$gateways = [ 'stripe' => new WC_Gateway_Stripe() ];
	}
	public function payment_gateways() {
		return self::$gateways;
	}
}

class WC_DateTime extends DateTime {
	public function date( $format ) {
		return gmdate( $format, $this->getTimestamp() );
	}
	public function getOffsetTimestamp() {
		return $this->getTimestamp() + $this->getOffset();
	}
}

class WC_Customer {
	public $data = [];
	public function __construct( $user_id ) {
		$this->data = [
			'user_id'      => $user_id,
			'date_created' => gmdate( 'Y-m-d H:i:s' ),
		];
	}
	public function get_id() {
		return $this->data['user_id'];
	}
	public function get_date_created() {
		return new WC_DateTime( $this->data['date_created'] );
	}
	public function get_total_spent() {
		return get_user_meta( $this->get_id(), 'wc_total_spent', true );
	}
	public function get_billing_first_name() {
		return get_user_meta( $this->get_id(), 'first_name', true );
	}
	public function get_billing_last_name() {
		return get_user_meta( $this->get_id(), 'last_name', true );
	}
	public function get_billing_email() {
		return get_userdata( $this->get_id() )->user_email;
	}
}

$orders_database = [];

class WC_Order {
	public $data = [ 'items' => [] ];
	public $meta = [];
	public function __construct( $data ) {
		global $orders_database;
		$data['id'] = count( $orders_database ) + 1;
		if ( ! isset( $data['date_paid'] ) ) {
			$data['date_paid'] = gmdate( 'Y-m-d H:i:s' );
		}
		$this->data = array_merge( $data, $this->data );
		if ( $data['status'] === 'completed' ) {
			// Update customer's total spent.
			$customer = new WC_Customer( $this->get_customer_id() );
			$total_spent = $customer->get_total_spent() + $this->get_total();
			update_user_meta( $customer->get_id(), 'wc_total_spent', $total_spent );
			// Add the order to the mock DB.
		}
		if ( isset( $data['meta'] ) ) {
			$this->meta = $data['meta'];
		}
		$orders_database[] = $this;
	}
	public function get_id() {
		return $this->data['id'];
	}
	public function get_customer_id() {
		return $this->data['customer_id'];
	}
	public function get_meta( $field_name ) {
		return isset( $this->meta[ $field_name ] ) ? $this->meta[ $field_name ] : '';
	}
	public function has_status( $statuses ) {
		return in_array( $this->data['status'], $statuses );
	}
	public function get_items() {
		return $this->data['items'];
	}
	public function get_date_paid() {
		return new WC_DateTime( $this->data['date_paid'] );
	}
	public function get_date_completed() {
		return new WC_DateTime( $this->data['date_completed'] );
	}
	public function get_total() {
		return $this->data['total'];
	}
	public function get_status() {
		return $this->data['status'];
	}
}

class WC_Subscription {
	public $data = [];
	public $meta = [];
	public $orders = [];
	public function __construct( $data ) {
		$this->data = array_merge( $data, $this->data );
		if ( isset( $data['meta'] ) ) {
			$this->meta = $data['meta'];
		}
		if ( isset( $data['orders'] ) ) {
			$this->orders = $data['orders'];
			usort(
				$this->orders,
				function( $a, $b ) {
					return $b->get_date_paid()->getTimestamp() <=> $a->get_date_paid()->getTimestamp();
				}
			);
		}
	}
	public function get_id() {
		return $this->data['id'];
	}
	public function get_customer_id() {
		return $this->data['customer_id'];
	}
	public function get_meta( $field_name ) {
		return isset( $this->meta[ $field_name ] ) ? $this->meta[ $field_name ] : '';
	}
	public function has_status( $statuses ) {
		return in_array( $this->data['status'], $statuses );
	}
	public function get_date_paid() {
		return new WC_DateTime( $this->data['date_paid'] );
	}
	public function get_total() {
		return $this->data['total'];
	}
	public function get_status() {
		return $this->data['status'];
	}
	public function get_billing_period() {
		return $this->data['billing_period'];
	}
	public function get_billing_interval() {
		return $this->data['billing_interval'];
	}
	public function get_last_order() {
		if ( ! empty( $this->orders ) ) {
			return end( $this->orders );
		}
		return false;
	}
	public function get_date( $type ) {
		return $this->data['dates'][ $type ] ?? 0;
	}
	public function calculate_date() {
		$start    = strtotime( $this->get_date( 'start' ) );
		$interval = $this->get_billing_interval();
		$period   = $this->get_billing_period();
		$end      = time();

		while ( $start <= $end ) {
			$start = strtotime( "+$interval $period", $start );
		}
		return gmdate( 'Y-m-d H:i:s', $start );
	}
	public function update_dates( $dates ) {
		foreach ( $dates as $type => $date ) {
			$this->data['dates'][ $type ] = $date;
		}
	}
	public function save() {
		return true;
	}
}

function wc_create_order( $data ) {
	return new WC_Order( $data );
}
function wc_get_checkout_url() {
	return 'https://example.com/checkout';
}
function wcs_is_subscription( $order ) {
	return false;
}
function wcs_get_subscriptions_for_order( $order ) {
	return [];
}
function wcs_get_users_subscriptions( $order ) {
	return [];
}
function wc_get_orders( $args ) {
	global $orders_database;
	$orders = $orders_database;
	if ( isset( $args['customer_id'] ) ) {
		// Filter by customer.
		$orders = array_filter(
			$orders_database,
			function( $order ) use ( $args ) {
				return $order->get_customer_id() === $args['customer_id'];
			}
		);
	}
	if ( isset( $args['status'] ) ) {
		// Filter by status.
		$orders = array_filter(
			$orders_database,
			function( $order ) use ( $args ) {
				return 'wc-' . $order->get_status() === $args['status'][0];
			}
		);
	}
	usort(
		$orders,
		function( $a, $b ) {
			return $b->get_date_paid()->getTimestamp() <=> $a->get_date_paid()->getTimestamp();
		}
	);
	return $orders;
}

function wc_customer_bought_product( $customer_email, $user_id, $product_id ) {
	return false;
}
