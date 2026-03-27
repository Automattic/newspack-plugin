<?php
/**
 * Newspack admin notices.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_HANDOFF', 'newspack_handoff' );
define( 'NEWSPACK_HANDOFF_RETURN_URL', 'newspack_handoff_return_url' );
define( 'NEWSPACK_HANDOFF_SHOW_ON_BLOCK_EDITOR', 'newspack_handoff_show_on_block_editor' );
define( 'NEWSPACK_HANDOFF_BANNER_TEXT', 'newspack_handoff_banner_text' );
define( 'NEWSPACK_HANDOFF_BANNER_BUTTON_TEXT', 'newspack_handoff_banner_button_text' );
define( 'NEWSPACK_HANDOFF_DESTINATION_PAGE', 'newspack_handoff_destination_page' );

/**
 * Manages the API as a whole.
 */
class Handoff_Banner {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'current_screen', [ $this, 'clear_handoff_url' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_styles' ], 1 );
		add_action( 'enqueue_block_editor_assets', [ $this, 'insert_block_editor_handoff_banner' ] );
		add_action( 'in_admin_header', [ $this, 'insert_handoff_banner' ] );
		add_action( 'newspack_before_wizard_content', [ $this, 'insert_handoff_banner_static' ] );
	}

	/**
	 * Render element into which Handoff Banner will be rendered via JS.
	 * Used on non-wizard admin pages.
	 *
	 * @return void.
	 */
	public function insert_handoff_banner() {
		if ( ! self::needs_handoff_return_ui() ) {
			return;
		}

		printf(
			"<div id='newspack-handoff-banner' data-primary_button_url='%s' data-banner_text='%s' data-banner_button_text='%s'></div>",
			esc_url( get_option( NEWSPACK_HANDOFF_RETURN_URL ) ),
			esc_attr( get_option( NEWSPACK_HANDOFF_BANNER_TEXT, '' ) ),
			esc_attr( get_option( NEWSPACK_HANDOFF_BANNER_BUTTON_TEXT, '' ) )
		);
	}

	/**
	 * Render a fully server-side Handoff Banner.
	 * Used on Newspack wizard pages where the JS-based banner cannot be used.
	 *
	 * @return void.
	 */
	public function insert_handoff_banner_static() {
		if ( ! self::needs_handoff_return_ui() ) {
			return;
		}

		$return_url  = esc_url( get_option( NEWSPACK_HANDOFF_RETURN_URL ) );
		$banner_text = get_option( NEWSPACK_HANDOFF_BANNER_TEXT, '' );
		$button_text = get_option( NEWSPACK_HANDOFF_BANNER_BUTTON_TEXT, '' );

		if ( empty( $banner_text ) ) {
			$banner_text = __( 'Return to Newspack after completing configuration', 'newspack-plugin' );
		}
		if ( empty( $button_text ) ) {
			$button_text = __( 'Back to Newspack', 'newspack-plugin' );
		}
		?>
		<div id="newspack-handoff-banner">
			<div class="newspack-handoff-banner">
				<div class="newspack-handoff-banner__text"><?php echo esc_html( $banner_text ); ?></div>
				<div class="newspack-handoff-banner__buttons">
					<button
						type="button"
						class="components-button is-tertiary is-small"
						onclick="this.closest('#newspack-handoff-banner').remove()"
					>
						<?php esc_html_e( 'Dismiss', 'newspack-plugin' ); ?>
					</button>
					<a href="<?php echo esc_url( $return_url ); ?>" class="components-button is-primary is-small">
						<?php echo esc_html( $button_text ); ?>
					</a>
				</div>
			</div>
		</div>
		<script>
		( function() {
			var el = document.getElementById( 'newspack-handoff-banner' );
			var wpcontent = document.getElementById( 'wpcontent' );
			if ( el && wpcontent ) {
				var paddingLeft = parseInt( window.getComputedStyle( wpcontent ).paddingLeft, 10 );
				if ( paddingLeft ) {
					el.style.marginLeft = '-' + paddingLeft + 'px';
					el.style.width = 'calc(100% + ' + paddingLeft + 'px)';
				}
			}
		} )();
		</script>
		<?php
	}

	/**
	 * Render a handoff banner on the block editor if needed.
	 *
	 * @return void
	 */
	public function insert_block_editor_handoff_banner() {
		if ( ! self::needs_block_editor_handoff_return_ui() ) {
			return;
		}

		$handle = 'newspack-handoff-banner-block-editor';
		wp_register_script(
			$handle,
			Newspack::plugin_url() . '/src/wizards/handoff-banner/block-editor.js',
			[ 'wp-element', 'wp-editor', 'wp-components' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		$banner_text        = get_option( NEWSPACK_HANDOFF_BANNER_TEXT, '' );
		$banner_button_text = get_option( NEWSPACK_HANDOFF_BANNER_BUTTON_TEXT, '' );
		$script_info        = [
			'text'       => $banner_text ? $banner_text : __( 'Return to Newspack after completing configuration', 'newspack' ),
			'buttonText' => $banner_button_text ? $banner_button_text : __( 'Back to Newspack', 'newspack' ),
			'returnURL'  => esc_url( get_option( NEWSPACK_HANDOFF_RETURN_URL, '' ) ),
		];
		wp_localize_script( $handle, 'newspack_handoff', $script_info );
		wp_enqueue_script( $handle );
	}

	/**
	 * Enqueue script and styles for Handoff Banner.
	 */
	public function enqueue_styles() {
		if ( ! self::needs_handoff_return_ui() ) {
			return;
		}
		$handle = 'newspack-handoff-banner';
		wp_register_style(
			$handle,
			Newspack::plugin_url() . '/dist/handoff-banner.css',
			[ 'wp-components' ],
			NEWSPACK_PLUGIN_VERSION
		);
		wp_enqueue_style( $handle );

		$screen = get_current_screen();
		if ( $screen && stristr( $screen->id, 'newspack' ) ) {
			return;
		}

		Newspack::load_common_assets();

		$asset = include NEWSPACK_ABSPATH . 'dist/handoff-banner.asset.php';
		wp_register_script(
			$handle,
			Newspack::plugin_url() . '/dist/handoff-banner.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);
		wp_enqueue_script( $handle );
	}

	/**
	 * Register the slug of plugin that is about to be visited.
	 *
	 * @param  array   $plugin Slug of plugin to be visited.
	 * @param  boolean $show_on_block_editor Whether to show on block editor.
	 * @param  string  $banner_text Custom banner body text.
	 * @param  string  $banner_button_text Custom banner button text.
	 * @return void
	 */
	public static function register_handoff_for_plugin( $plugin, $show_on_block_editor = false, $banner_text = '', $banner_button_text = '' ) {
		update_option( NEWSPACK_HANDOFF, $plugin );
		update_option( NEWSPACK_HANDOFF_SHOW_ON_BLOCK_EDITOR, (bool) $show_on_block_editor );
		update_option( NEWSPACK_HANDOFF_BANNER_TEXT, sanitize_text_field( $banner_text ) );
		update_option( NEWSPACK_HANDOFF_BANNER_BUTTON_TEXT, sanitize_text_field( $banner_button_text ) );
	}

	/**
	 * Should handoff return UI be shown?
	 *
	 * @return bool
	 */
	public static function needs_handoff_return_ui() {
		return get_option( NEWSPACK_HANDOFF ) ? true : false;
	}

	/**
	 * Should handoff return UI be shown on the block editor?
	 *
	 * @return bool
	 */
	public static function needs_block_editor_handoff_return_ui() {
		return self::needs_handoff_return_ui() && (bool) get_option( NEWSPACK_HANDOFF_SHOW_ON_BLOCK_EDITOR, false );
	}

	/**
	 * If the current admin page is part of the Newspack dashboard, clear the handoff URL. This ensures the handoff banner won't be shown on Newspack admin pages.
	 *
	 * @param WP_Screen $current_screen The current screen object.
	 * @return void
	 */
	public function clear_handoff_url( $current_screen ) {
		if ( stristr( $current_screen->id, 'newspack' ) ) {
			$destination_page = get_option( NEWSPACK_HANDOFF_DESTINATION_PAGE, '' );
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( $destination_page && isset( $_GET['page'] ) && sanitize_text_field( wp_unslash( $_GET['page'] ) ) === $destination_page ) {
				return;
			}
			update_option( NEWSPACK_HANDOFF, null );
			update_option( NEWSPACK_HANDOFF_SHOW_ON_BLOCK_EDITOR, false );
			update_option( NEWSPACK_HANDOFF_BANNER_TEXT, '' );
			update_option( NEWSPACK_HANDOFF_BANNER_BUTTON_TEXT, '' );
			update_option( NEWSPACK_HANDOFF_DESTINATION_PAGE, '' );
		}
	}
}
new Handoff_Banner();
