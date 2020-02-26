<?php
/**
 * Newspack's Payment Wizard
 *
 * @package Newspack
 */

namespace Newspack;

require_once NEWSPACK_ABSPATH . 'vendor/autoload.php';

use \WP_Error, \WP_Query;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Interface for managing payments for Newspack hosted plan.
 */
class Payment_Wizard extends Wizard {

	const NEWSPACK_STRIPE_CUSTOMER     = '_newspack_hosted_stripe_customer';
	const NEWSPACK_STRIPE_SUBSCRIPTION = '_newspack_hosted_stripe_subscription';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-payment-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
		add_action( 'init', [ $this, 'retrieve_subscription' ] );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {

		// Get data about Stripe customer/subscription.
		register_rest_route(
			'newspack/v1/wizard/',
			'/newspack-payment-wizard/',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_stripe_data' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Create a Stripe checkout session, return information needed to redirect to it.
		register_rest_route(
			'newspack/v1/wizard/',
			'/newspack-payment-wizard/checkout',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_stripe_checkout_id' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Get Stripe data, if available.
	 */
	public function api_get_stripe_data() {
		\Stripe\Stripe::setApiKey( self::stripe_secret_key() );
		$customer_id     = get_option( self::NEWSPACK_STRIPE_CUSTOMER, '' );
		$subscription_id = get_option( self::NEWSPACK_STRIPE_SUBSCRIPTION, '' );
		$customer        = $customer_id ? \Stripe\Customer::retrieve( $customer_id ) : null;
		$subscription    = $subscription_id ? \Stripe\Subscription::retrieve( $subscription_id ) : null;
		return \rest_ensure_response(
			[
				'customer'     => $customer,
				'subscription' => $subscription,
			]
		);
	}

	/**
	 * Get Stripe Checkout ID.
	 */
	public function api_get_stripe_checkout_id() {
		\Stripe\Stripe::setApiKey( self::stripe_secret_key() );
		$customer_id      = get_option( self::NEWSPACK_STRIPE_CUSTOMER, null );
		$subscription_id  = get_option( self::NEWSPACK_STRIPE_SUBSCRIPTION, null );
		$customer         = $customer_id ? \Stripe\Customer::retrieve( $customer_id ) : null;
		$subscription     = $subscription_id ? \Stripe\Subscription::retrieve( $subscription_id ) : null;
		$base_url         = get_admin_url( null, 'admin.php' ) . '?page=newspack-payment-wizard';
		$success_url      = $base_url . '&session_id={CHECKOUT_SESSION_ID}';
		$cancel_url       = $base_url;
		$has_customer     = $customer && ! $customer['deleted'];
		$has_subscription = $subscription && 'canceled' !== $subscription['status'];
		$params           = [
			'payment_method_types' => [ 'card' ],
			'success_url'          => $success_url,
			'cancel_url'           => $cancel_url,
		];

		if ( $has_customer && $has_subscription ) {
			$params['mode']              = 'setup';
			$params['setup_intent_data'] = [
				'metadata' => [
					'customer_id'     => $customer['id'],
					'subscription_id' => $subscription['id'],
				],
			];
		} elseif ( $has_customer ) {
			$params['customer']          = $customer['id'];
			$params['subscription_data'] = [
				'items' => [
					[
						'plan' => self::stripe_plan(),
					],
				],
			];
		} else {
			$user                        = wp_get_current_user();
			$params['customer_email']    = $user->user_email;
			$params['subscription_data'] = [
				'items' => [
					[
						'plan' => self::stripe_plan(),
					],
				],
			];
		}
		$session = \Stripe\Checkout\Session::create( $params );
		return \rest_ensure_response(
			[
				'session_id'             => $session['id'],
				'stripe_publishable_key' => self::stripe_publishable_key(),
			]
		);
	}

	/**
	 * After Stripe Checkout event, retrieve information about the transation by session ID and store customer and subscription in the options table.
	 */
	public function retrieve_subscription() {
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}
		$session_id = filter_input( INPUT_GET, 'session_id', FILTER_SANITIZE_STRING );
		if ( ! $session_id ) {
			return;
		}
		\Stripe\Stripe::setApiKey( self::stripe_secret_key() );
		$session_result = \Stripe\Checkout\Session::retrieve( $session_id );
		if ( ! $session_result ) {
			return;
		}
		/* https://stripe.com/docs/payments/checkout/subscriptions/starting */
		if ( isset( $session_result['customer'], $session_result['subscription'] ) && $session_result['customer'] && $session_result['subscription'] ) {
			update_option( self::NEWSPACK_STRIPE_CUSTOMER, sanitize_text_field( $session_result['customer'] ) );
			update_option( self::NEWSPACK_STRIPE_SUBSCRIPTION, sanitize_text_field( $session_result['subscription'] ) );
		}

		/* https://stripe.com/docs/payments/checkout/subscriptions/updating */
		if ( isset( $session_result['setup_intent'] ) && $session_result['setup_intent'] ) {
			$setup_intent      = \Stripe\SetupIntent::retrieve( $session_result['setup_intent'] );
			$customer_id       = isset( $setup_intent['metadata']['customer_id'] ) ? $setup_intent['metadata']['customer_id'] : null;
			$subscription_id   = isset( $setup_intent['metadata']['subscription_id'] ) ? $setup_intent['metadata']['subscription_id'] : null;
			$payment_method_id = isset( $setup_intent['payment_method'] ) ? $setup_intent['payment_method'] : null;
			$customer          = $customer_id ? \Stripe\Customer::retrieve( $customer_id ) : null;
			if ( ! $customer || ( isset( $customer['deleted'] ) && $customer['deleted'] ) ) {
				return;
			}
			$payment_method = \Stripe\PaymentMethod::retrieve( $payment_method_id );
			$payment_method->attach( [ 'customer' => $customer['id'] ] );
			\Stripe\Customer::update(
				$customer['id'],
				[
					'invoice_settings' => [ 'default_payment_method' => $payment_method_id ],
				]
			);
			\Stripe\Subscription::update(
				$subscription_id,
				[
					'default_payment_method' => $payment_method_id,
				]
			);
			update_option( self::NEWSPACK_STRIPE_CUSTOMER, sanitize_text_field( $customer['id'] ) );
			update_option( self::NEWSPACK_STRIPE_SUBSCRIPTION, sanitize_text_field( $subscription_id ) );
		}
		wp_safe_redirect( get_admin_url( null, 'admin.php' ) . '?page=newspack-payment-wizard' );
		exit;
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return \esc_html__( 'Managed Newspack', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Manage payment information for Newspack hosted plan.', 'newspack' );
	}

	/**
	 * Get the duration of this wizard.
	 *
	 * @return string A description of the expected duration (e.g. '10 minutes').
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		\wp_enqueue_script(
			'newspack-payment-wizard',
			Newspack::plugin_url() . '/dist/payment.js',
			$this->get_script_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/payment.js' ),
			true
		);

		\wp_register_style(
			'newspack-payment-wizard',
			Newspack::plugin_url() . '/dist/payment.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/payment.css' )
		);
		\wp_style_add_data( 'newspack-payment-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-payment-wizard' );
	}

	/**
	 * Return Stripe publishable key from environment variable.
	 *
	 * @return string Stripe publishable key.
	 */
	public static function stripe_publishable_key() {
		return ( defined( 'NEWSPACK_STRIPE_PUBLISHABLE_KEY' ) && NEWSPACK_STRIPE_PUBLISHABLE_KEY ) ? NEWSPACK_STRIPE_PUBLISHABLE_KEY : false;
	}

	/**
	 * Return Stripe secret key from environment variable.
	 *
	 * @return string Stripe secret key.
	 */
	public static function stripe_secret_key() {
		return ( defined( 'NEWSPACK_STRIPE_SECRET_KEY' ) && NEWSPACK_STRIPE_SECRET_KEY ) ? NEWSPACK_STRIPE_SECRET_KEY : false;
	}

	/**
	 * Check if necessary constants are configured.
	 *
	 * @return boolean True if all Stripe constants are defined.
	 */
	public static function stripe_plan() {
		return ( defined( 'NEWSPACK_STRIPE_PLAN' ) && NEWSPACK_STRIPE_PLAN ) ? NEWSPACK_STRIPE_PLAN : false;
	}

	/**
	 * Return Stripe plan.
	 *
	 * @return bool True if all necessary variables are present.
	 */
	public static function configured() {
		return self::stripe_publishable_key() && self::stripe_secret_key() && self::stripe_plan();
	}
}
