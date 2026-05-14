<?php
/**
 * Newspack Emails Section.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Emails;
use Newspack\Reader_Activation;
use Newspack\Reader_Revenue_Emails;
use Newspack\Wizards\Wizard_Section;
use Newspack\WooCommerce_Emails;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Emails Section Class.
 */
class Emails_Section extends Wizard_Section {
	/**
	 * Containing wizard slug.
	 *
	 * @var string
	 */
	protected $wizard_slug = 'newspack-settings';

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_rest_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'wizard/' . $this->wizard_slug . '/emails',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_email_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		if ( WooCommerce_Emails::is_active() ) {
			register_rest_route(
				NEWSPACK_API_NAMESPACE,
				'wizard/' . $this->wizard_slug . '/emails',
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ __CLASS__, 'api_update_email_settings' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
					'args'                => [
						'enable_woocommerce_email_editor' => [
							'type'              => 'boolean',
							'required'          => true,
							'sanitize_callback' => 'rest_sanitize_boolean',
						],
					],
				]
			);
		}
	}

	/**
	 * Get the unified email registry.
	 *
	 * Returns all known email entries keyed by a stable slug. Each entry
	 * includes metadata used by the Settings > Emails UI.
	 *
	 * @return array Registry entries keyed by slug.
	 */
	public static function get_email_registry(): array {
		return [
			'verification'                  => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-verification',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Reader verification', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader needs to verify their email address.', 'newspack-plugin' ),
			],
			'login-link'                    => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-magic-link',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Magic login link', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader requests a magic login link.', 'newspack-plugin' ),
			],
			'login-otp'                     => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-otp-authentication',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Login one-time password', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader logs in with a one-time password.', 'newspack-plugin' ),
			],
			'set-new-password'              => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-reset-password',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Password reset', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader requests a password reset.', 'newspack-plugin' ),
			],
			'receipt'                       => [
				'source'              => 'newspack',
				'newspack_type'       => 'receipt',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Payment receipt', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent after a successful payment.', 'newspack-plugin' ),
			],
			'welcome'                       => [
				'source'              => 'newspack',
				'newspack_type'       => 'welcome',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Welcome email', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to new supporters after their first payment.', 'newspack-plugin' ),
			],
			'cancellation'                  => [
				'source'              => 'newspack',
				'newspack_type'       => 'cancellation',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Cancellation confirmation', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader cancels their subscription.', 'newspack-plugin' ),
			],
			'woo-renewal-reminder'          => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_renewal_invoice',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'label'               => __( 'Subscription renewal invoice', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to remind a customer that a renewal payment is due.', 'newspack-plugin' ),
			],
			'woo-payment-retry'             => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_payment_retry',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'label'               => __( 'Subscription payment retry', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a failed subscription payment is about to be retried.', 'newspack-plugin' ),
			],
			'woo-subscription-cancelled'    => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'cancelled_subscription',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'label'               => __( 'Subscription cancelled', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a subscription is cancelled.', 'newspack-plugin' ),
			],
			'woo-expired-subscription'      => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'expired_subscription',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'label'               => __( 'Subscription expired', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a subscription reaches its expiration date.', 'newspack-plugin' ),
			],
			'woo-customer-new-account'      => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_new_account',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'New account', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a customer creates a new account.', 'newspack-plugin' ),
			],
			'woo-password-reset'            => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_reset_password',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Password reset (WooCommerce)', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a customer resets their password via WooCommerce.', 'newspack-plugin' ),
			],
			'delete-account'                => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-delete-account',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Account deletion', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader requests to delete their account.', 'newspack-plugin' ),
			],
			'change-email-notification'     => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-change-email-cancel',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Email change notification', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the old address when a reader changes their email.', 'newspack-plugin' ),
			],
			'change-email-confirmation'     => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-change-email',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Email change confirmation', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the new address to confirm an email change.', 'newspack-plugin' ),
			],
			'non-reader-login-reminder'     => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-non-reader-user',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Non-reader login reminder', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a non-reader WordPress user tries to log in as a reader.', 'newspack-plugin' ),
			],
			'group-subscription-invitation' => [
				'source'              => 'newspack',
				'newspack_type'       => 'group-subscription-invite',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Group subscription invitation', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to invite a reader to join a group subscription.', 'newspack-plugin' ),
			],
			'woo-refund'                    => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_refunded_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Order refund', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when an order is refunded.', 'newspack-plugin' ),
			],
			// TODO: Customer-facing email. PRD rationale should be "lower customization priority for subscription publishers" instead of "admin-facing".
			'woo-processing-order'          => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_processing_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Order processing', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when an order payment is received and the order begins processing.', 'newspack-plugin' ),
			],
			// TODO: Customer-facing email. PRD rationale should be "lower customization priority for subscription publishers" instead of "admin-facing".
			'woo-completed-order'           => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_completed_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Order complete', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when an order is marked as complete.', 'newspack-plugin' ),
			],
			// TODO: Customer-facing email. PRD rationale should be "lower customization priority for subscription publishers" instead of "admin-facing".
			'woo-on-hold-order'             => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_on_hold_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'label'               => __( 'Order on hold', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when an order is placed on hold.', 'newspack-plugin' ),
			],
			'woo-new-order'                 => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'new_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'admin',
				'label'               => __( 'New order (admin)', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the admin when a new order is placed.', 'newspack-plugin' ),
			],
		];
	}

	/**
	 * Get email settings.
	 *
	 * @return array
	 */
	public static function api_get_email_settings(): array {
		$settings = [];
		if ( class_exists( 'WooCommerce' ) ) {
			$settings['admin_url']                       = admin_url( 'admin.php?page=wc-settings&tab=email' );
			$settings['enable_woocommerce_email_editor'] = 'yes' === WooCommerce_Emails::is_enabled();
		}

		// Build newspack_emails from the Emails system, enriched with registry data.
		$config_names = [];
		if ( ! Reader_Activation::is_enabled() ) {
			$config_names = array_values( Reader_Revenue_Emails::EMAIL_TYPES );
		}
		$emails = Emails::get_emails( $config_names, false );

		// Build a lookup from newspack_type => registry entry.
		$registry        = self::get_email_registry();
		$registry_lookup = [];
		foreach ( $registry as $slug => $entry ) {
			if ( isset( $entry['newspack_type'] ) ) {
				$registry_lookup[ $entry['newspack_type'] ] = array_merge( $entry, [ 'registry_slug' => $slug ] );
			}
		}

		$newspack_emails = [];
		foreach ( $emails as $type => $email ) {
			if ( isset( $registry_lookup[ $type ] ) ) {
				$match                        = $registry_lookup[ $type ];
				$email['recommended']         = $match['recommended'];
				$email['view_category']       = $match['recommended'] ? 'essentials' : 'all-enabled';
				$email['trigger_description'] = $match['trigger_description'];
				$email['registry_slug']       = $match['registry_slug'];
				$email['recipient']           = $match['recipient'];
			} else {
				$email['recommended']         = false;
				$email['view_category']       = 'available';
				$email['trigger_description'] = '';
				$email['registry_slug']       = '';
				$email['recipient']           = 'reader';
			}
			$newspack_emails[] = $email;
		}

		// Sort: reader-revenue first, reader-activation second, woocommerce last.
		// Within each group, preserve registry insertion order.
		$category_order = [
			'reader-revenue'    => 0,
			'reader-activation' => 1,
		];
		usort(
			$newspack_emails,
			function ( $a, $b ) use ( $category_order ) {
				$order_a = $category_order[ $a['category'] ?? '' ] ?? 2;
				$order_b = $category_order[ $b['category'] ?? '' ] ?? 2;
				return $order_a - $order_b;
			}
		);

		$settings['newspack_emails'] = $newspack_emails;
		$settings['post_type']       = Emails::POST_TYPE;

		return $settings;
	}

	/**
	 * API callback to update woocommerce email settings.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response Response.
	 */
	public static function api_update_email_settings( $request ) {
		if ( $request->has_param( 'enable_woocommerce_email_editor' ) ) {
			$enable = filter_var( $request->get_param( 'enable_woocommerce_email_editor' ), FILTER_VALIDATE_BOOLEAN );
			WooCommerce_Emails::set_enabled( $enable );
		}
		return rest_ensure_response( self::api_get_email_settings() );
	}
}
