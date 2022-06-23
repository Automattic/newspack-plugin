<?php
/**
 * Newspack Blocks.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\ReaderRegistration;

use Newspack;
use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

const FORM_ACTION = 'newspack_reader_registration';

/**
 * Do not register block hooks if Reader Activation is not enabled.
 */
if ( ! Reader_Activation::is_enabled() ) {
	return;
}

/**
 * Register block from metadata.
 */
function register_block() {
	register_block_type_from_metadata(
		__DIR__ . '/block.json',
		array(
			'render_callback' => __NAMESPACE__ . '\\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\\register_block' );

/**
 * Enqueue front-end scripts.
 */
function enqueue_scripts() {
	$handle = 'newspack-reader-registration-block';
	\wp_enqueue_style(
		$handle,
		\Newspack\Newspack::plugin_url() . '/dist/reader-registration-block.css',
		[],
		NEWSPACK_PLUGIN_VERSION
	);
	\wp_enqueue_script(
		$handle,
		\Newspack\Newspack::plugin_url() . '/dist/reader-registration-block.js',
		[ 'wp-polyfill', 'newspack-reader-activation' ],
		NEWSPACK_PLUGIN_VERSION,
		true
	);
	\wp_script_add_data( $handle, 'async', true );
	\wp_script_add_data( $handle, 'amp-plus', true );
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_scripts' );

/**
 * Render Registration Block.
 *
 * @param array[] $attrs Block attributes.
 */
function render_block( $attrs ) {
	if ( \is_user_logged_in() || Reader_Activation::get_auth_intention_value() ) {
		return;
	}
	ob_start();
	?>
	<div class="newspack-reader-registration <?php echo esc_attr( get_block_classes( $attrs ) ); ?>">
		<form>
			<?php \wp_nonce_field( FORM_ACTION, FORM_ACTION ); ?>
			<input type="email" name="email" autocomplete="email" placeholder="<?php echo \esc_attr( $attrs['placeholder'] ); ?>" />
			<input type="submit" value="<?php echo \esc_attr( $attrs['label'] ); ?>" />
		</form>
	</div>
	<?php
	return ob_get_clean();
}

/**
 * Utility to assemble the class for a server-side rendered block.
 *
 * @param array $attrs Block attributes.
 * @param array $extra Additional classes to be added to the class list.
 *
 * @return string Class list separated by spaces.
 */
function get_block_classes( $attrs = [], $extra = [] ) {
	$classes = [];
	if ( isset( $attrs['align'] ) && ! empty( $attrs['align'] ) ) {
		$classes[] = 'align' . $attrs['align'];
	}
	if ( isset( $attrs['className'] ) ) {
		array_push( $classes, $attrs['className'] );
	}
	if ( is_array( $extra ) && ! empty( $extra ) ) {
		$classes = array_merge( $classes, $extra );
	}
	if ( ! empty( $attrs['hideControls'] ) ) {
		$classes[] = 'hide-controls';
	}

	return implode( ' ', $classes );
}

/**
 * Process registration form.
 */
function process_form() {
	if ( ! isset( $_REQUEST[ FORM_ACTION ] ) || ! \wp_verify_nonce( \sanitize_text_field( $_REQUEST[ FORM_ACTION ] ), FORM_ACTION ) ) {
		return;
	}

	if ( ! isset( $_REQUEST['email'] ) || empty( $_REQUEST['email'] ) ) {
		return;
	}

	$email   = \sanitize_email( $_REQUEST['email'] );
	$user_id = Reader_Activation::register_reader( $email );

	/**
	 * Fires after a reader is registered through the Reader Registration Block.
	 *
	 * @param string              $email   Email address of the reader.
	 * @param int|false|\WP_Error $user_id The created user ID in case of registration, false if not created or a WP_Error object.
	 */
	\do_action( 'newspack_reader_registration_form_processed', $email, $user_id );

	if ( \wp_is_json_request() ) {
		if ( ! \is_wp_error( $user_id ) ) {
			$message = __( 'Thank you for registering!', 'newspack' );
		} else {
			$message = $user_id->get_error_message();
		}
		\wp_send_json( compact( 'message', 'email' ), \is_wp_error( $user_id ) ? 400 : 200 );
		exit;
	} elseif ( isset( $_SERVER['REQUEST_METHOD'] ) && 'GET' === $_SERVER['REQUEST_METHOD'] ) {
		\wp_safe_redirect(
			\add_query_arg(
				[ 'newspack_reader' => is_wp_error( $user_id ) ? '0' : '1' ],
				\remove_query_arg( [ '_wp_http_referer', 'newspack_reader_registration', 'email' ] )
			)
		);
		exit;
	}
}
add_action( 'template_redirect', __NAMESPACE__ . '\\process_form' );
