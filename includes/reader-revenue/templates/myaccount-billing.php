<?php
/**
 * My Account Payments.
 *
 * @package Newspack
 */

defined( 'ABSPATH' ) || exit;

?>

<style>
	.newspack-wc-error{
		background: #ff000038;
		padding: 1px 28px;
		border-radius: 5px;
		border: 1px solid #ff4364;
	}
</style>

<?php
if ( $error_message ) :
	?>

	<div class="newspack-wc-error">
		<p><?php echo esc_html( $error_message ); ?></p>
	</div>

	<?php
else :
	?>

	<a href="<?php echo esc_url( $stripe_billing_portal_url ); ?>">
		<?php echo esc_html__( 'Update payment details', 'newspack' ); ?>
	</a>

	<?php
endif;
