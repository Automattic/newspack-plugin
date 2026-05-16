<?php
/**
 * Newspack Emails Section.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Emails;
use Newspack\Logger;
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
		if ( class_exists( 'WooCommerce' ) ) {
			register_rest_route(
				NEWSPACK_API_NAMESPACE,
				'wizard/' . $this->wizard_slug . '/emails/(?P<id>[A-Za-z0-9_]+)/toggle',
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ __CLASS__, 'api_toggle_wc_email' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
					'args'                => [
						'id'      => [
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						],
						'enabled' => [
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
		$registry = [
			'verification'                     => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-verification',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Reader verification', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader needs to verify their email address.', 'newspack-plugin' ),
			],
			'login-link'                       => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-magic-link',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Magic login link', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader requests a magic login link.', 'newspack-plugin' ),
			],
			'login-otp'                        => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-otp-authentication',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Login one-time password', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader logs in with a one-time password.', 'newspack-plugin' ),
			],
			'set-new-password'                 => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-reset-password',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Password reset', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader requests a password reset.', 'newspack-plugin' ),
			],
			'receipt'                          => [
				'source'              => 'newspack',
				'newspack_type'       => 'receipt',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Payment receipt', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent after a successful payment.', 'newspack-plugin' ),
			],
			'welcome'                          => [
				'source'              => 'newspack',
				'newspack_type'       => 'welcome',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Welcome email', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to new supporters after their first payment.', 'newspack-plugin' ),
			],
			'cancellation'                     => [
				'source'              => 'newspack',
				'newspack_type'       => 'cancellation',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Cancellation confirmation', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader cancels their subscription.', 'newspack-plugin' ),
			],
			'woo-renewal-reminder'             => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_notification_auto_renewal',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Renewal reminder', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent before automatic renewal (timing depends on WooCommerce Subscriptions settings).', 'newspack-plugin' ),
			],
			'woo-payment-retry'                => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_payment_retry',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Failed order retry', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a renewal payment fails, before the retry attempt.', 'newspack-plugin' ),
			],
			'woo-expired-subscription'         => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'expired_subscription',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Subscription expired', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a subscription reaches its expiration date.', 'newspack-plugin' ),
			],
			'woo-subscription-switch-complete' => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_completed_switch_order',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Subscription switch complete', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader switches their subscription.', 'newspack-plugin' ),
			],
			'woo-new-giftee-account'           => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'WCSG_Email_Customer_New_Account',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'New giftee account', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the giftee when a gift subscription creates their account.', 'newspack-plugin' ),
			],
			'woo-new-gift-order'               => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'recipient_completed_order',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'New gift order', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the giftee to notify them of a gift subscription.', 'newspack-plugin' ),
			],
			'woo-customer-new-account'         => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_new_account',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'New account', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a customer creates a new account.', 'newspack-plugin' ),
			],
			'delete-account'                   => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-delete-account',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Account deletion', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader requests to delete their account.', 'newspack-plugin' ),
			],
			'change-email-notification'        => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-change-email-cancel',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Email change notification', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the old address when a reader changes their email.', 'newspack-plugin' ),
			],
			'change-email-confirmation'        => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-change-email',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Email change confirmation', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the new address to confirm an email change.', 'newspack-plugin' ),
			],
			'non-reader-login-reminder'        => [
				'source'              => 'newspack',
				'newspack_type'       => 'reader-activation-non-reader-user',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'auth-account',
				'label'               => __( 'Non-reader login reminder', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a non-reader WordPress user tries to log in as a reader.', 'newspack-plugin' ),
			],
			'group-subscription-invitation'    => [
				'source'              => 'newspack',
				'newspack_type'       => 'group-subscription-invite',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Group subscription invitation', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to invite a reader to join a group subscription.', 'newspack-plugin' ),
			],
			'woo-refund'                       => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'customer_refunded_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'reader',
				'chip'                => 'reader-revenue',
				'label'               => __( 'Order refund', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when an order is refunded.', 'newspack-plugin' ),
			],
			'woo-new-order'                    => [
				'source'              => 'woocommerce',
				'woo_email_id'        => 'new_order',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'recipient'           => 'admin',
				'chip'                => 'reader-revenue',
				'label'               => __( 'New order', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the admin when a new order is placed.', 'newspack-plugin' ),
			],
		];

		/**
		 * Filters the unified email registry.
		 *
		 * Allows external integration plugins to register additional email
		 * entries that appear in the Settings > Emails UI.
		 *
		 * @param array $registry Registry entries keyed by slug.
		 */
		return apply_filters( 'newspack_emails_registry', $registry );
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
				$email['label']               = $match['label'];
				$email['recommended']         = $match['recommended'];
				$email['trigger_description'] = $match['trigger_description'];
				$email['registry_slug']       = $match['registry_slug'];
				$email['recipient']           = $match['recipient'];
				$email['source']              = $match['source'];
				$email['chip']                = $match['chip'];
			} else {
				$email['recommended']         = false;
				$email['trigger_description'] = '';
				$email['registry_slug']       = '';
				$email['recipient']           = 'reader';
				$email['source']              = 'newspack'; // Default; WooCommerce emails always match above.
				$email['chip']                = 'auth-account'; // Fallback so unregistered emails still appear in a tab.
			}
			$newspack_emails[] = $email;
		}

		// First-run: enable recommended WC emails by default.
		// Runs on this GET handler for simplicity — guarded by a one-shot option
		// flag so it only fires once, and the enable logic is idempotent.
		if ( class_exists( 'WooCommerce' ) && ! get_option( 'newspack_unified_emails_wc_first_run', false ) ) {
			self::first_run_enable_wc_emails( $registry );
			update_option( 'newspack_unified_emails_wc_first_run', true, false );
		}

		// Resolve woocommerce-source registry entries to live WC_Email instances.
		if ( class_exists( 'WooCommerce' ) ) {
			$wc_mailer_emails = \WC()->mailer()->get_emails();
			foreach ( $registry as $slug => $entry ) {
				if ( 'woocommerce' !== $entry['source'] ) {
					continue;
				}
				// Plugin dependency check.
				if ( ! empty( $entry['plugin_dependency'] ) ) {
					$plugin_file = $entry['plugin_dependency'] . '/' . $entry['plugin_dependency'] . '.php';
					if ( ! \Newspack\is_plugin_active( $plugin_file ) ) {
						continue;
					}
				}
				$wc_email_id = $entry['woo_email_id'];
				// WC stores emails keyed by class name. Find the instance by matching $id.
				$wc_email       = null;
				$wc_email_class = null;
				foreach ( $wc_mailer_emails as $class_name => $email_instance ) {
					if ( $email_instance->id === $wc_email_id ) {
						$wc_email       = $email_instance;
						$wc_email_class = $class_name;
						break;
					}
				}
				if ( ! $wc_email ) {
					Logger::log( "WC email '$wc_email_id' not found for registry '$slug'.", 'NEWSPACK-EMAILS', 'warning' );
					continue;
				}
				$preview_post_id   = self::get_wc_email_template_post_id( $wc_email_id );
				$newspack_emails[] = [
					'label'               => $entry['label'],
					'post_id'             => 'wc:' . $wc_email_id,
					'preview_post_id'     => $preview_post_id,
					'edit_link'           => self::get_wc_email_edit_link( $wc_email_id, $wc_email_class ),
					'status'              => 'yes' === $wc_email->enabled ? 'publish' : 'draft',
					'type'                => $wc_email_id,
					'category'            => 'woocommerce',
					'trigger_description' => $entry['trigger_description'],
					'registry_slug'       => $slug,
					'recipient'           => $entry['recipient'],
					'source'              => 'woocommerce',
					'chip'                => $entry['chip'],
				];
			}
		}

		// Sort: reader-revenue first, reader-activation second, woocommerce last.
		// Within each group, preserve registry insertion order via a stable tiebreaker.
		// Category strings originate from Reader_Revenue_Emails::add_email_configs(),
		// Reader_Activation_Emails::add_email_configs(), and WooCommerce_Emails.
		$category_order = [
			'reader-revenue'    => 0,
			'reader-activation' => 1,
		];
		$slug_order = array_flip( array_keys( $registry ) );
		usort(
			$newspack_emails,
			function ( $a, $b ) use ( $category_order, $slug_order ) {
				$order_a = $category_order[ $a['category'] ?? '' ] ?? 2;
				$order_b = $category_order[ $b['category'] ?? '' ] ?? 2;
				if ( $order_a !== $order_b ) {
					return $order_a - $order_b;
				}
				$idx_a = $slug_order[ $a['registry_slug'] ?? '' ] ?? PHP_INT_MAX;
				$idx_b = $slug_order[ $b['registry_slug'] ?? '' ] ?? PHP_INT_MAX;
				return $idx_a - $idx_b;
			}
		);

		$settings['newspack_emails'] = $newspack_emails;
		$settings['post_type']       = Emails::POST_TYPE;

		return $settings;
	}

	/**
	 * Get the WC block-editor template post ID for a given email, if available.
	 *
	 * Checks whether the WC block email editor feature is enabled and
	 * whether a woo_email template post exists for the given email ID.
	 *
	 * @param string $wc_email_id The WC_Email ID (e.g. 'new_order').
	 * @return int|null Template post ID, or null.
	 */
	private static function get_wc_email_template_post_id( string $wc_email_id ): ?int {
		if ( 'yes' !== get_option( 'woocommerce_feature_block_email_editor_enabled' ) ) {
			return null;
		}

		$posts_manager_class = 'Automattic\\WooCommerce\\Internal\\EmailEditor\\WCTransactionalEmails\\WCTransactionalEmailPostsManager';
		if ( ! class_exists( $posts_manager_class ) ) {
			return null;
		}

		$template_post_id = $posts_manager_class::get_instance()->get_email_template_post_id( $wc_email_id );
		if ( empty( $template_post_id ) ) {
			return null;
		}

		return (int) $template_post_id;
	}

	/**
	 * Build the edit link for a WooCommerce email.
	 *
	 * When the WC block email editor is enabled and a template post exists
	 * for the email, returns the block editor URL. Otherwise falls back to
	 * the classic WC settings page.
	 *
	 * @param string $wc_email_id    The WC_Email ID (e.g. 'customer_new_account').
	 * @param string $wc_email_class The WC_Email class name (array key from get_emails()).
	 * @return string Admin URL for editing this email.
	 */
	private static function get_wc_email_edit_link( string $wc_email_id, string $wc_email_class ): string {
		$classic_url = add_query_arg(
			[
				'page'    => 'wc-settings',
				'tab'     => 'email',
				'section' => strtolower( $wc_email_class ),
			],
			admin_url( 'admin.php' )
		);

		$template_post_id = self::get_wc_email_template_post_id( $wc_email_id );
		if ( ! $template_post_id ) {
			return $classic_url;
		}

		return add_query_arg(
			[
				'post'   => $template_post_id,
				'action' => 'edit',
			],
			admin_url( 'post.php' )
		);
	}

	/**
	 * Enable all recommended WC emails on first run.
	 *
	 * Called once so that registry WC emails default to enabled when the
	 * unified emails UI is first loaded.
	 *
	 * @param array $registry The email registry.
	 */
	private static function first_run_enable_wc_emails( array $registry ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		$wc_mailer_emails = \WC()->mailer()->get_emails();
		foreach ( $registry as $entry ) {
			if ( 'woocommerce' !== $entry['source'] || empty( $entry['recommended'] ) ) {
				continue;
			}
			// Plugin dependency check.
			if ( ! empty( $entry['plugin_dependency'] ) ) {
				$plugin_file = $entry['plugin_dependency'] . '/' . $entry['plugin_dependency'] . '.php';
				if ( ! \Newspack\is_plugin_active( $plugin_file ) ) {
					continue;
				}
			}
			$wc_email_id = $entry['woo_email_id'];
			$wc_email    = null;
			foreach ( $wc_mailer_emails as $email_instance ) {
				if ( $email_instance->id === $wc_email_id ) {
					$wc_email = $email_instance;
					break;
				}
			}
			if ( ! $wc_email ) {
				continue;
			}
			if ( 'yes' !== $wc_email->enabled ) {
				$option_key = $wc_email->get_option_key();
				$options    = (array) get_option( $option_key, [] );
				$options['enabled'] = 'yes';
				update_option( $option_key, $options );
			}
			// Auto-renewal notice needs the master switch enabled too.
			if ( 'customer_notification_auto_renewal' === $wc_email_id ) {
				if ( 'yes' !== get_option( 'woocommerce_subscriptions_customer_notifications_enabled' ) ) {
					update_option( 'woocommerce_subscriptions_customer_notifications_enabled', 'yes' );
				}
			}
		}
	}

	/**
	 * Toggle a WooCommerce email on or off.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error Response or error.
	 */
	public static function api_toggle_wc_email( $request ) {
		$wc_email_id = $request->get_param( 'id' );
		$enabled     = $request->get_param( 'enabled' );

		if ( ! class_exists( 'WooCommerce' ) ) {
			return new \WP_Error( 'not_found', 'WooCommerce is not active.', [ 'status' => 404 ] );
		}

		// Only allow toggling IDs that exist in our registry.
		$registry          = self::get_email_registry();
		$allowed_wc_ids    = array_column(
			array_filter( $registry, fn( $e ) => 'woocommerce' === $e['source'] ),
			'woo_email_id'
		);
		if ( ! in_array( $wc_email_id, $allowed_wc_ids, true ) ) {
			return new \WP_Error( 'not_found', 'WC email not found in registry.', [ 'status' => 404 ] );
		}

		$wc_mailer_emails = \WC()->mailer()->get_emails();
		$wc_email         = null;
		foreach ( $wc_mailer_emails as $email_instance ) {
			if ( $email_instance->id === $wc_email_id ) {
				$wc_email = $email_instance;
				break;
			}
		}

		if ( ! $wc_email ) {
			return new \WP_Error( 'not_found', 'WC email not found.', [ 'status' => 404 ] );
		}

		$option_key = $wc_email->get_option_key();
		$options    = (array) get_option( $option_key, [] );
		$options['enabled'] = $enabled ? 'yes' : 'no';
		update_option( $option_key, $options );

		return rest_ensure_response( self::api_get_email_settings() );
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
