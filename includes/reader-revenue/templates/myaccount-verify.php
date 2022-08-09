<?php
/**
 * My Account page before account has been verified.
 * The user will be asked to verify before they can manage account settings.
 *
 * @package Newspack
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_before_edit_account_form' );

global $newspack_reset_password_arg;
global $newspack_send_magic_link_arg;

$message = false;
if ( isset( $_GET['message'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$message = $_GET['message']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
}

$is_error = false;
if ( isset( $_GET['is_error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$is_error = $_GET['is_error']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
}
?>

<?php
if ( $message ) :
	?>
	<div class="newspack-wc-message <?php echo $is_error ? 'newspack-wc-message--error' : ''; ?>">
		<p><?php echo esc_html( $message ); ?></p>
	</div>
	<?php
endif;
?>

<div class="newspack-verify-account-message">
	<p>
		<?php esc_html_e( 'You must verify your account before you can manage account settings. Verify with a link or by setting a password.', 'newspack' ); ?>
	</p>
	<p>
		<a class="woocommerce-Button button" href="<?php echo '?' . esc_attr( $newspack_send_magic_link_arg ) . '=' . esc_attr( wp_create_nonce( $newspack_send_magic_link_arg ) ); ?>">
			<?php esc_html_e( 'Send me a link', 'newspack' ); ?>
		</a>
		<a class="woocommerce-Button button" href="<?php echo '?' . esc_attr( $newspack_reset_password_arg ) . '=' . esc_attr( wp_create_nonce( $newspack_reset_password_arg ) ); ?>">
			<?php esc_html_e( 'Set a new password', 'newspack' ); ?>
		</a>
	</p>
</div>

<?php do_action( 'woocommerce_after_edit_account_form' ); ?>
