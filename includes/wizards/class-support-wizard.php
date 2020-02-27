<?php
/**
 * Newspack's Support Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Interface for support for Newspack customers.
 */
class Support_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-support-wizard';

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
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		// Create a support ticket.
		register_rest_route(
			'newspack/v1/wizard/',
			'/newspack-support-wizard/ticket',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_create_support_ticket' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Create a support ticket.
	 *
	 * @param WP_REST_Request $request The request.
	 */
	public function api_create_support_ticket( $request ) {
		if ( empty( $request['subject'] ) ) {
			return new WP_Error( 'newspack_invalid_support', __( 'Please provide a subject.' ) );
		}
		if ( empty( $request['message'] ) ) {
			return new WP_Error( 'newspack_invalid_support', __( 'Please provide a message.' ) );
		}

		$user      = wp_get_current_user();
		$full_name = $user->first_name . ' ' . $user->last_name;
		if ( ' ' == $full_name ) {
			$full_name = $user->data->display_name;
		}

		$message = '<b>Newspack site:</b> <a href="' . site_url() . '">' . site_url() . '</a><br/><b>Message:</b> ' . $request['message'];

		$request_body = wp_json_encode(
			array(
				'request' => array(
					'requester' => array(
						'name'  => $full_name,
						'email' => $user->data->user_email,
					),
					'subject'   => '[Newspack] ' . $request['subject'],
					'comment'   => array(
						'html_body' => $message,
					),
				),
			)
		);

		$response = wp_safe_remote_post(
			self::support_api_url() . '/requests.json',
			array(
				'body'    => $request_body,
				'headers' => array(
					'Content-Type' => 'application/json',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'newspack_invalid_support',
				__( 'Something went wrong. Please contact us directly at ' ) . '<a href="mailto:' . self::support_email() . '">' . self::support_email() . '</a>'
			);
		} else {
			return \rest_ensure_response(
				array(
					'status' => 'created',
				)
			);
		}
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return \esc_html__( 'Support', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Contact suppport.', 'newspack' );
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
	 * Enqueue Support Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		\wp_enqueue_script(
			'newspack-support-wizard',
			Newspack::plugin_url() . '/dist/support.js',
			$this->get_script_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/support.js' ),
			true
		);

		\wp_register_style(
			'newspack-support-wizard',
			Newspack::plugin_url() . '/dist/support.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/support.css' )
		);
		\wp_style_add_data( 'newspack-support-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-support-wizard' );
	}

	/**
	 * Return support API URL from environment variable.
	 *
	 * @return string support API URL.
	 */
	public static function support_api_url() {
		return ( defined( 'NEWSPACK_SUPPORT_API_URL' ) && NEWSPACK_SUPPORT_API_URL ) ? NEWSPACK_SUPPORT_API_URL : false;
	}

	/**
	 * Return support email address from environment variable.
	 *
	 * @return string support email address.
	 */
	public static function support_email() {
		return ( defined( 'NEWSPACK_SUPPORT_EMAIL' ) && NEWSPACK_SUPPORT_EMAIL ) ? NEWSPACK_SUPPORT_EMAIL : false;
	}

	/**
	 * Check if wizard is configured and should be displayed.
	 *
	 * @return bool True if necessary variables are present.
	 */
	public static function configured() {
		return self::support_api_url() && self::support_email();
	}
}
