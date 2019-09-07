<?php
/**
 * Enhancements and improvements to third-party plugins for AMP compatibility.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Tweaks third-party plugins for better AMP compatibility.
 * When possible it's preferred to contribute AMP fixes downstream to the actual plugin.
 */
class AMP_Enhancements {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'do_shortcode_tag', [ __CLASS__, 'documentcloud_iframe_full_height' ], 10, 2 );
		add_action( 'admin_notices', [ __CLASS__, 'disqus_amp_notice' ] );
		add_action( 'admin_notices', [ __CLASS__, 'disqus_amp_activate' ], 9 );
	}

	/**
	 * Add an attribute to the iframe instructing AMP that the iframe should be rendered with the "fill" style instead
	 * of the "fixed-height" style.
	 *
	 * @see https://github.com/ampproject/amp-wp/issues/3142
	 * @param string $output HTML output of the shortcode.
	 * @param string $tag The shortcode currently being processed.
	 * @return string Modified shortcode output.
	 */
	public static function documentcloud_iframe_full_height( $output, $tag ) {
		if ( 'documentcloud' !== $tag ) {
			return $output;
		}

		return str_replace( '<iframe', '<iframe layout="fill"', $output );
	}

	/**
	 * Output a notice if Disqus is being run without the AMP-compatibility plugin.
	 */
	public static function disqus_amp_notice() {
		if ( ! current_user_can( 'install_plugins' ) ) {
			return;
		}

		$plugins = Plugin_Manager::get_managed_plugins();

		if ( 'active' === $plugins['disqus-comment-system']['Status'] && 'active' !== $plugins['newspack-disqus-amp']['Status'] ) {
			$cta = 'inactive' === $plugins['newspack-disqus-amp']['Status'] ? __( 'Activate Newspack Disqus AMP compatibility.', 'newspack' ) : __( 'Install and activate Newspack Disqus AMP compatibility.', 'newspack' );
			?>
			<div class='notice notice-error'>
				<p><?php esc_html_e( 'You are using the Disqus comment system without the Newspack Disqus AMP plugin. Your comments form will not display on AMP pages.', 'newspack' ); ?></p>
				<p><a href='<?php echo esc_url( wp_nonce_url( admin_url(), 'newspack_activate_disqus_amp', 'newspack_activate_disqus_amp' ) ); ?>' class='button burron-primary'><?php echo esc_html( $cta ); ?></a></p>
			</div>
			<?php
		}
	}

	/**
	 * Process the link in the notice to install the Disqus AMP-compatibility plugin.
	 */
	public static function disqus_amp_activate() {
		if ( ! filter_input( INPUT_GET, 'newspack_activate_disqus_amp', FILTER_SANITIZE_SPECIAL_CHARS ) || ! wp_verify_nonce( filter_input( INPUT_GET, 'newspack_activate_disqus_amp', FILTER_SANITIZE_SPECIAL_CHARS ), 'newspack_activate_disqus_amp' ) ) {
			return;
		}

		if ( ! current_user_can( 'install_plugins' ) ) {
			wp_die( esc_html__( 'You cannot perform this action.', 'newspack' ) );
		}

		Plugin_Manager::activate( 'newspack-disqus-amp' );
		$plugins = Plugin_Manager::get_managed_plugins();
		if ( 'active' === $plugins['newspack-disqus-amp']['Status'] ) {
			?>
			<div class='notice notice-success is-dismissible'>
				<p><?php esc_html_e( 'Newspack Disqus AMP is now active. Your comments form will work correctly on AMP and non-AMP pages.', 'newspack' ); ?></p>
			</div>
			<?php
		}
	}
}
AMP_Enhancements::init();
