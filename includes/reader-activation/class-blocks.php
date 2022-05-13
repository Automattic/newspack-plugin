<?php
/**
 * Reader Activation Blocks.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Activation Blocks Class.
 */
final class Blocks {
	/**
	 * Initialize Hooks.
	 */
	public static function init() {
		\add_action( 'init', [ __CLASS__, 'register_blocks' ] );
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
		\add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );
		\add_action( 'template_redirect', [ __CLASS__, 'process_registration_form' ] );
	}

	/**
	 * Register blocks.
	 */
	public static function register_blocks() {
		\register_block_type(
			'newspack/reader-registration',
			[
				'category'        => 'newspack',
				'attributes'      => [
					'placeholder'  => [
						'type'    => 'string',
						'default' => __( 'Enter your email address', 'newspack' ),
					],
					'button_label' => [
						'type'    => 'string',
						'default' => __( 'Register', 'newspack' ),
					],
				],
				'supports'        => [ 'align' ],
				'render_callback' => [ __CLASS__, 'render_registration_block' ],
			]
		);
	}

	/**
	 * Render Registration Block.
	 *
	 * @param array[] $attrs Block attributes.
	 */
	public static function render_registration_block( $attrs ) {
		ob_start();
		if ( \is_user_logged_in() || Reader_Activation::get_auth_intention() ) {
			return;
		}
		?>
		<div class="newspack-reader-registration-block">
			<form method="POST">
				<?php \wp_nonce_field( 'newspack_reader_registration', 'newspack_registration' ); ?>
				<input type="email" name="newspack_reg_email" placeholder="<?php echo \esc_attr( $attrs['placeholder'] ); ?>" />
				<button><?php echo \esc_html( $attrs['button_label'] ); ?></button>
			</form>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Process registration form.
	 */
	public static function process_registration_form() {
		if ( ! isset( $_POST['newspack_registration'] ) || ! isset( $_POST['newspack_reg_email'] ) || empty( $_POST['newspack_reg_email'] ) ) {
			return;
		}

		if ( ! \wp_verify_nonce( $_POST['newspack_registration'], 'newspack_reader_registration' ) ) { // phpcs:ignore
			return;
		}

		$email  = \sanitize_email( $_POST['newspack_reg_email'] );
		$result = Reader_Activation::register_reader( $email );

		if ( \wp_is_json_request() ) {
			if ( ! \is_wp_error( $result ) ) {
				$message = __( 'Thank you for registering!', 'newspack' );
			} else {
				$message = $result->get_error_message();
			}
			\wp_send_json( compact( 'message' ), \is_wp_error( $result ) ? 400 : 200 );
		}
	}

	/**
	 * Enqueue front-end scripts.
	 */
	public static function enqueue_scripts() {
		\wp_enqueue_style(
			'newspack-reader-activation-blocks',
			\Newspack::plugin_url() . '/dist/blocks.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Enqueue blocks scripts and styles for editor.
	 */
	public static function enqueue_block_editor_assets() {
		Newspack::load_common_assets();

		\wp_enqueue_script(
			'newspack-reader-activation-blocks',
			Newspack::plugin_url() . '/dist/blocks.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_enqueue_style(
			'newspack-reader-activation-blocks',
			Newspack::plugin_url() . '/dist/blocks.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}
}
Blocks::init();
