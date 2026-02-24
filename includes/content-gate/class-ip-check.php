<?php
/**
 * Content Gate IP Check.
 *
 * @package Newspack
 */

namespace Newspack\Content_Gate;

use Newspack\Newspack;

/**
 * IP Check class.
 */
class IP_Check {

	/**
	 * The name of the cookie used to bypass cache and allow server side IP checking.
	 */
	const COOKIE_NAME = 'wp_nocache_ip';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
		add_action( 'wp_footer', [ __CLASS__, 'add_login_modal' ] );
		add_action( 'wp_ajax_newspack_content_gate_check_ip', [ __CLASS__, 'ajax_check_ip' ] );
		add_action( 'wp_ajax_nopriv_newspack_content_gate_check_ip', [ __CLASS__, 'ajax_check_ip' ] );
	}

	/**
	 * AJAX callback to check IP validity.
	 */
	public static function ajax_check_ip() {
		/**
		 * Filter whether the current IP is valid for content gate access.
		 *
		 * @param bool $valid_ip Whether the IP is valid. Default false.
		 */
		$valid_ip = apply_filters( 'newspack_content_gate_check_ip', false );
		wp_send_json( [ 'valid_ip' => (bool) $valid_ip ] );
	}

	/**
	 * Enqueue scripts for AJAX functionality.
	 */
	public static function enqueue_scripts() {
		wp_enqueue_script(
			'newspack-content-gate-ip-check',
			Newspack::plugin_url() . '/dist/content-gate-ip-check.js',
			[ 'jquery' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'newspack-content-gate-ip-check',
			'newspack_ip_access',
			[
				'cookie_name' => self::COOKIE_NAME,
				'ajax_url'    => admin_url( 'admin-ajax.php' ),
			]
		);
	}

	/**
	 * Render the inner IP check content (message div, spinner, continue button).
	 *
	 * @return string The HTML content.
	 */
	public static function render_ip_check_content() {
		ob_start();
		?>
		<div class="newspack-signin-ip-login-message"></div>
		<button type="submit" class="newspack-signin-ip-button newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide"><?php esc_html_e( 'Continue', 'newspack-teams-for-wc-memberships-access-by-ip' ); ?></button>
		<?php
		return ob_get_clean();
	}

	/**
	 * Add login modal HTML to footer.
	 */
	public static function add_login_modal() {
		?>
		<div id="newspack-signin-ip-login-modal" class="newspack-ui newspack-ui__modal-container newspack-signin-ip-modal" data-state="closed" style="display: none;">
			<div class="newspack-ui__modal-container__overlay"></div>
			<div class="newspack-ui__modal newspack-ui__modal--small newspack-signin-ip-modal-content">
				<div class="newspack-ui__modal__header">
					<h2><?php esc_html_e( 'Sign in by IP', 'newspack-teams-for-wc-memberships-access-by-ip' ); ?></h2>
					<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close newspack-signin-ip-modal-close" aria-label="<?php esc_attr_e( 'Close', 'newspack-teams-for-wc-memberships-access-by-ip' ); ?>">
						<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-teams-for-wc-memberships-access-by-ip' ); ?></span>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
							<path d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z"/>
						</svg>
					</button>
				</div>
				<div class="newspack-ui__modal__content">
					<div class="newspack-ui">
						<?php echo self::render_ip_check_content(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
IP_Check::init();
