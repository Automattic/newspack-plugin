<?php
/**
 * Newspack Blocks.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\ReaderRegistration;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

const FORM_ACTION = 'newspack_reader_registration';

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
	<div class="newspack-reader-registration">
		<form method="POST">
			<?php \wp_nonce_field( FORM_ACTION, FORM_ACTION ); ?>
			<input type="email" name="email" autocomplete="email" placeholder="<?php echo \esc_attr( $attrs['placeholder'] ); ?>" />
			<input type="submit" value="<?php echo \esc_attr( $attrs['label'] ); ?>" />
		</form>
	</div>
	<?php
	return ob_get_clean();
}

/**
 * Process registration form.
 */
function process_form() {
	if ( ! isset( $_POST[ FORM_ACTION ] ) || ! \wp_verify_nonce( \sanitize_text_field( $_POST[ FORM_ACTION ] ), FORM_ACTION ) ) {
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
add_action( 'template_redirect', __NAMESPACE__ . '\\process_form' );
