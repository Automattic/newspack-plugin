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

		$configs = Emails::get_email_configs();

		// Newspack-source rows: scope to the configs whose source resolves
		// to 'newspack' (defaulting unspecified to 'newspack'), then defer
		// to Emails::get_emails() for post resolution + serialization.
		// serialize_email() now forwards the four new schema fields, so the
		// returned rows already carry trigger_description, recipient,
		// recommended, chip, and source.
		$newspack_types = [];
		foreach ( $configs as $type => $config ) {
			$source = isset( $config['source'] ) ? $config['source'] : 'newspack';
			if ( 'newspack' !== $source ) {
				continue;
			}
			if ( ! Reader_Activation::is_enabled() && ! in_array( $type, array_values( Reader_Revenue_Emails::EMAIL_TYPES ), true ) ) {
				continue;
			}
			$newspack_types[] = $type;
		}
		$emails          = Emails::get_emails( $newspack_types, false );
		$newspack_emails = [];
		foreach ( $emails as $type => $email ) {
			$email['registry_slug'] = $type;
			$newspack_emails[]      = $email;
		}

		// WooCommerce-source rows: walk the unified configs and build rows
		// directly from each $config['wc_email_instance']. The WC integration
		// (WooCommerce_Emails::get_email_configs()) already gates on plugin
		// dependencies and skips entries WC doesn't surface, so reaching this
		// loop means the email is supposed to appear.
		foreach ( $configs as $type => $config ) {
			$source = isset( $config['source'] ) ? $config['source'] : 'newspack';
			if ( 'woocommerce' !== $source ) {
				continue;
			}
			$wc_email = isset( $config['wc_email_instance'] ) ? $config['wc_email_instance'] : null;
			if ( ! $wc_email ) {
				continue;
			}
			// Read enabled state from the option rather than the in-memory
			// WC_Email::$enabled property, which can be stale after WC option
			// writes within the same request.
			$option_key        = $wc_email->get_option_key();
			$wc_options        = (array) get_option( $option_key, [] );
			$is_enabled        = isset( $wc_options['enabled'] ) ? 'yes' === $wc_options['enabled'] : 'yes' === $wc_email->enabled;
			$wc_email_class    = get_class( $wc_email );
			$newspack_emails[] = [
				'label'               => $config['label'],
				'post_id'             => 'wc:' . $type,
				'edit_link'           => self::get_wc_email_edit_link( $wc_email_class ),
				'status'              => $is_enabled ? 'publish' : 'draft',
				'type'                => $type,
				'category'            => 'woocommerce',
				'trigger_description' => $config['trigger_description'],
				'registry_slug'       => $type,
				'recipient'           => $config['recipient'],
				'source'              => 'woocommerce',
				'chip'                => $config['chip'],
				'recommended'         => $config['recommended'],
			];
		}

		// Sort: reader-revenue first, reader-activation second, woocommerce last.
		// Within each group, preserve the order configs were registered in
		// (config-insertion order is what the providers control).
		$category_order = [
			'reader-revenue'    => 0,
			'reader-activation' => 1,
		];
		$type_order = array_flip( array_keys( $configs ) );
		usort(
			$newspack_emails,
			function ( $a, $b ) use ( $category_order, $type_order ) {
				$order_a = $category_order[ $a['category'] ?? '' ] ?? 2;
				$order_b = $category_order[ $b['category'] ?? '' ] ?? 2;
				if ( $order_a !== $order_b ) {
					return $order_a - $order_b;
				}
				$idx_a = $type_order[ $a['type'] ?? '' ] ?? PHP_INT_MAX;
				$idx_b = $type_order[ $b['type'] ?? '' ] ?? PHP_INT_MAX;
				return $idx_a - $idx_b;
			}
		);

		$settings['newspack_emails'] = $newspack_emails;
		$settings['post_type']       = Emails::POST_TYPE;

		return $settings;
	}

	/**
	 * Build the edit link for a WooCommerce email.
	 *
	 * Minimal WC classic-settings URL. Slice 2 (nppd-1527) re-adds the
	 * block-editor branch (when `woocommerce_feature_block_email_editor_enabled`
	 * is on) and the `preview_post_id` resolution that goes with it.
	 *
	 * @param string $wc_email_class Fully-qualified WC_Email subclass name.
	 * @return string Classic WC settings URL for the email.
	 */
	private static function get_wc_email_edit_link( string $wc_email_class ): string {
		return add_query_arg(
			[
				'page'    => 'wc-settings',
				'tab'     => 'email',
				'section' => strtolower( $wc_email_class ),
			],
			admin_url( 'admin.php' )
		);
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
