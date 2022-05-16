<?php
/**
 * Newspack Blocks.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Blocks Class.
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
	 * Register Blocks.
	 */
	public static function register_blocks() {
		if ( Reader_Activation::is_enabled() ) {
			self::register_reader_registration_block();
		}
	}

	/**
	 * Register reader registration block.
	 */
	private static function register_reader_registration_block() {
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
		if ( \is_user_logged_in() || Reader_Activation::get_auth_intention() ) {
			return;
		}
		ob_start();
		?>
		<div class="newspack-reader-registration-block">
			<form method="POST">
				<?php \wp_nonce_field( 'newspack_reader_registration', 'newspack_reader_registration' ); ?>
				<input type="email" name="email" autocomplete="email" placeholder="<?php echo \esc_attr( $attrs['placeholder'] ); ?>" />
				<input type="submit" value="<?php echo \esc_attr( $attrs['button_label'] ); ?>" />
			</form>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Process registration form.
	 */
	public static function process_registration_form() {

		if ( ! isset( $_POST['newspack_reader_registration'] ) || ! \wp_verify_nonce( $_POST['newspack_reader_registration'], 'newspack_reader_registration' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return;
		}

		if ( ! isset( $_POST['email'] ) || empty( $_POST['email'] ) ) {
			return;
		}

		$email  = \sanitize_email( $_POST['email'] );
		$result = Reader_Activation::register_reader( $email );

		/**
		 * Fires after a reader is registered through the Reader Registration Block.
		 *
		 * @param string               $email  Email address of the reader.
		 * @param int|string|\WP_Error $result The created user ID in case of registration, the user email if user already exists, or a WP_Error object.
		 */
		\do_action( 'newspack_reader_registration_form_processed', $email, $result );

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
			'newspack-blocks',
			Newspack::plugin_url() . '/dist/blocks.css',
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
			'newspack-blocks',
			Newspack::plugin_url() . '/dist/blocks.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_localize_script(
			'newspack-blocks',
			'newspack_blocks',
			[
				'reader_registration_enabled' => Reader_Activation::is_enabled(),
			]
		);
		\wp_enqueue_style(
			'newspack-blocks',
			Newspack::plugin_url() . '/dist/blocks.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}
}
Blocks::init();
