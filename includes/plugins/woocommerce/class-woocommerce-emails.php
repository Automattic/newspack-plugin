<?php
/**
 * Enable Woos block email editor.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request, WP_REST_Response, WP_REST_Server;

/**
 * WooCommerce Emails class.
 */
class WooCommerce_Emails {
	/**
	 * Option to track if the feature is enabled.
	 *
	 * @var string
	 */
	const WOOCOMMERCE_EMAIL_EDITOR_OPTION = 'newspack_woocommerce_feature_block_email_editor_enabled';

	/**
	 * Option to determine whether email templates have been updated.
	 *
	 * @var string
	 */
	const WOOCOMMERCE_EMAILS_UPDATED_OPTION = 'newspack_woocommerce_block_editor_emails_updated_to_latest';

	/**
	 * Curated metadata for WooCommerce emails surfaced in the unified
	 * Emails UI, keyed by WC_Email->id. Unrecognized WC emails (those
	 * WC()->mailer()->get_emails() returns but this table doesn't list)
	 * are silently skipped at registration time, as are entries whose
	 * `plugin_dependency` isn't active.
	 *
	 * `plugin_dependency` is the plugin slug; the full file path is built
	 * at check time as "{slug}/{slug}.php". Use null for emails available
	 * from core WooCommerce.
	 *
	 * Note: this method returns the table (rather than a const) so the
	 * `label` and `trigger_description` strings can use __() — PHP < 8.2
	 * does not allow function calls in const arrays.
	 *
	 * @return array Metadata table keyed by WC_Email->id.
	 */
	private static function get_surfaced_wc_emails() {
		return [
			// WooCommerce core — available whenever WC is active.
			'customer_new_account'               => [
				'chip'                => 'auth-account',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => null,
				'label'               => __( 'New account', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a customer creates a new account.', 'newspack-plugin' ),
			],
			'customer_refunded_order'            => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'label'               => __( 'Order refund', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when an order is refunded.', 'newspack-plugin' ),
			],
			'new_order'                          => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'admin',
				'recommended'         => false,
				'plugin_dependency'   => null,
				'label'               => __( 'New order', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the admin when a new order is placed.', 'newspack-plugin' ),
			],
			// WooCommerce Subscriptions.
			'customer_notification_auto_renewal' => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'label'               => __( 'Renewal reminder', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent before automatic renewal (timing depends on WooCommerce Subscriptions settings).', 'newspack-plugin' ),
			],
			'customer_payment_retry'             => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'label'               => __( 'Failed order retry', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a renewal payment fails, before the retry attempt.', 'newspack-plugin' ),
			],
			'expired_subscription'               => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'label'               => __( 'Subscription expired', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a subscription reaches its expiration date.', 'newspack-plugin' ),
			],
			'customer_completed_switch_order'    => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'label'               => __( 'Subscription switch complete', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent when a reader switches their subscription.', 'newspack-plugin' ),
			],
			// WooCommerce Subscriptions Gifting (bundled into WC Subs core).
			'WCSG_Email_Customer_New_Account'    => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'label'               => __( 'New giftee account', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the giftee when a gift subscription creates their account.', 'newspack-plugin' ),
			],
			'recipient_completed_order'          => [
				'chip'                => 'reader-revenue',
				'recipient'           => 'reader',
				'recommended'         => true,
				'plugin_dependency'   => 'woocommerce-subscriptions',
				'label'               => __( 'New gift order', 'newspack-plugin' ),
				'trigger_description' => __( 'Sent to the giftee to notify them of a gift subscription.', 'newspack-plugin' ),
			],
		];
	}

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'option_woocommerce_feature_block_email_editor_enabled', [ __CLASS__, 'override_woocommerce_email_editor_option' ], 10, 2 );
		add_action( 'admin_init', [ __CLASS__, 'update_woocommerce_emails_to_latest' ] );
		add_filter( 'newspack_email_configs', [ __CLASS__, 'get_email_configs' ] );
	}

	/**
	 * Inject surfaced WooCommerce emails into the unified email config set.
	 *
	 * Discovery-based: iterates WC()->mailer()->get_emails() and looks up
	 * each instance's id in self::SURFACED_WC_EMAILS. Unrecognized WC
	 * emails are silently skipped; that's the contract — only emails we
	 * explicitly curate appear in the unified UI. Entries whose
	 * plugin_dependency isn't active are also skipped.
	 *
	 * Each registered config carries the live WC_Email instance as
	 * `wc_email_instance` so downstream code (toggle endpoint, first-run
	 * auto-enable, response builder) can call instance methods directly
	 * instead of re-resolving via WC()->mailer().
	 *
	 * @param array $configs Existing email configs from upstream providers.
	 * @return array Configs with surfaced WC emails added.
	 */
	public static function get_email_configs( $configs ) {
		if ( ! class_exists( 'WooCommerce' ) || ! function_exists( 'WC' ) ) {
			return $configs;
		}
		$surfaced  = self::get_surfaced_wc_emails();
		$wc_emails = \WC()->mailer()->get_emails();
		foreach ( $wc_emails as $wc_email ) {
			if ( ! isset( $surfaced[ $wc_email->id ] ) ) {
				continue;
			}
			$meta = $surfaced[ $wc_email->id ];
			if ( ! empty( $meta['plugin_dependency'] ) ) {
				$plugin_file = $meta['plugin_dependency'] . '/' . $meta['plugin_dependency'] . '.php';
				if ( ! \Newspack\is_plugin_active( $plugin_file ) ) {
					continue;
				}
			}
			$configs[ $wc_email->id ] = [
				'name'                => $wc_email->id,
				'category'            => 'woocommerce',
				'source'              => 'woocommerce',
				'label'               => $meta['label'],
				'description'         => $meta['trigger_description'],
				'trigger_description' => $meta['trigger_description'],
				'recipient'           => $meta['recipient'],
				'recommended'         => $meta['recommended'],
				'chip'                => $meta['chip'],
				'plugin_dependency'   => $meta['plugin_dependency'],
				'wc_email_instance'   => $wc_email,
			];
		}
		return $configs;
	}

	/**
	 * Force enable WooCommerce email editor.
	 *
	 * @param mixed  $value  Current value.
	 * @param string $option Option name.
	 */
	public static function override_woocommerce_email_editor_option( $value, $option ) {
		if ( ! self::is_active() ) {
			return $value;
		}
		return self::is_enabled();
	}

	/**
	 * Update the option to enable WooCommerce block email editor.
	 *
	 * @param bool $enable Whether to enable the feature.
	 */
	public static function set_enabled( $enable ) {
		update_option( self::WOOCOMMERCE_EMAIL_EDITOR_OPTION, $enable ? 'yes' : 'no' );
	}

	/**
	 * Check if WooCommerce block email editor is enabled. Default to enabled.
	 *
	 * @return string 'yes' if enabled, 'no' if not.
	 */
	public static function is_enabled() {
		return get_option( self::WOOCOMMERCE_EMAIL_EDITOR_OPTION, 'yes' );
	}

	/**
	 * Update any existing woocommerce block emails to the latest content if they haven't been customized.
	 */
	public static function update_woocommerce_emails_to_latest() {
		if ( ! self::is_active() || ! class_exists( '\Automattic\WooCommerce\Internal\EmailEditor\WCTransactionalEmails\WCTransactionalEmails' ) ) {
			return;
		}
		if ( 'yes' === self::is_enabled() && 'v1' !== get_option( self::WOOCOMMERCE_EMAILS_UPDATED_OPTION, '' ) ) {
			$email_ids              = \Automattic\WooCommerce\Internal\EmailEditor\WCTransactionalEmails\WCTransactionalEmails::get_transactional_emails();
			$email_template_manager = \Automattic\WooCommerce\Internal\EmailEditor\WCTransactionalEmails\WCTransactionalEmailPostsManager::get_instance();
			foreach ( $email_ids as $email_id ) {
				$template_id = $email_template_manager->get_email_template_post_id( $email_id );
				if ( ! $template_id ) {
					continue;
				}
				$publish_date       = get_the_date( 'Y-m-d H:i:s', $template_id );
				$last_modified_date = get_the_modified_date( 'Y-m-d H:i:s', $template_id );
				// Template has not been modified, so delete the post so we can regenerate the template.
				if ( $publish_date === $last_modified_date ) {
					wp_delete_post( $template_id, true );
				}
			}
			delete_transient( 'wc_email_editor_initial_templates_generated' );
			$email_template_generator = new \Automattic\WooCommerce\Internal\EmailEditor\WCTransactionalEmails\WCTransactionalEmailPostsGenerator();
			$email_template_generator->initialize();
			update_option( self::WOOCOMMERCE_EMAILS_UPDATED_OPTION, 'v1' );
		}
	}

	/**
	 * Whether email enhancements are active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		/**
		 * Enables Newspack WooCommerce email enhancements including
		 * improved templates and transactional email customizations.
		 *
		 * @constant NEWSPACK_EMAIL_ENHANCEMENTS
		 * @type     bool
		 * @default  Email enhancements disabled
		 * @status   draft
		 *
		 * @example define( 'NEWSPACK_EMAIL_ENHANCEMENTS', true );
		 */
		return defined( 'NEWSPACK_EMAIL_ENHANCEMENTS' ) && NEWSPACK_EMAIL_ENHANCEMENTS;
	}
}
WooCommerce_Emails::init();
