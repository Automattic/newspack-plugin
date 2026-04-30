<?php
/**
 * My Account v2 prototype — Account settings page.
 *
 * Profile / Password / Delete account, rendered when the demo flag is active
 * and the visitor lands on /my-account/edit-account/. Reuses the v1 DOM and
 * class names verbatim (per brief §2.1.1) so the existing v1 SCSS styling
 * applies for free; adds a Delete account modal hooked client-side.
 *
 * @package Newspack
 * @var array $args Template args; expected keys: `data` => fake-data array.
 */

defined( 'ABSPATH' ) || exit;

// WC core loads this via `wc_get_template( 'myaccount/form-edit-account.php' )`
// — the call site doesn't pass the demo's `data` arg, so fall back to the
// class' fake-data builder. Both code paths converge on the same shape.
$data   = isset( $args['data'] ) && is_array( $args['data'] )
	? $args['data']
	: \Newspack\My_Account_V2_Demo::get_fake_data();
$reader = isset( $data['reader'] ) ? $data['reader'] : [];
$user   = wp_get_current_user();
$email  = isset( $reader['email'] ) ? (string) $reader['email'] : (string) $user->user_email;

// Pull real values from the current user so reviewers can see their own data
// rendered in the template — matches how the homepage greeting picks up the
// admin's first name. Fake names fall back to the slug so the template never
// renders an empty input.
$first_name   = ! empty( $user->first_name ) ? $user->first_name : '';
$last_name    = ! empty( $user->last_name ) ? $user->last_name : '';
$display_name = ! empty( $user->display_name ) ? $user->display_name : $user->user_login;
?>
<div class="newspack-my-account-v2-demo-account-settings" data-newspack-my-account-v2-demo="account-settings">
	<section id="account-profile">
		<h4 class="newspack-ui__font--m newspack-ui__spacing-top--0"><?php esc_html_e( 'Profile', 'newspack-plugin' ); ?></h4>
		<form class="woocommerce-EditAccountForm edit-profile" data-action="update-profile">
			<p class="woocommerce-form-row woocommerce-form-row--first form-row form-row-first">
				<label for="account_first_name"><?php esc_html_e( 'First name', 'newspack-plugin' ); ?></label>
				<input
					type="text"
					class="woocommerce-Input woocommerce-Input--text input-text"
					name="account_first_name"
					id="account_first_name"
					autocomplete="given-name"
					value="<?php echo esc_attr( $first_name ); ?>"
				/>
			</p>
			<p class="woocommerce-form-row woocommerce-form-row--last form-row form-row-last">
				<label for="account_last_name"><?php esc_html_e( 'Last name', 'newspack-plugin' ); ?></label>
				<input
					type="text"
					class="woocommerce-Input woocommerce-Input--text input-text"
					name="account_last_name"
					id="account_last_name"
					autocomplete="family-name"
					value="<?php echo esc_attr( $last_name ); ?>"
				/>
			</p>
			<div class="clear"></div>

			<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide mt0">
				<label for="account_display_name"><?php esc_html_e( 'Display name', 'newspack-plugin' ); ?></label>
				<input
					type="text"
					class="woocommerce-Input woocommerce-Input--text input-text"
					name="account_display_name"
					id="account_display_name"
					autocomplete="name"
					value="<?php echo esc_attr( $display_name ); ?>"
				/>
				<span class="legend"><?php esc_html_e( 'This is how your name is displayed publicly.', 'newspack-plugin' ); ?></span>
			</p>

			<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide mt0">
				<label for="account_email_display"><?php esc_html_e( 'Email address', 'newspack-plugin' ); ?></label>
				<input
					type="email"
					class="woocommerce-Input woocommerce-Input--email input-text"
					name="account_email_display"
					id="account_email_display"
					autocomplete="email"
					disabled
					value="<?php echo esc_attr( $email ); ?>"
				/>
				<span class="legend">
					<?php
					echo wp_kses_post(
						sprintf(
							// translators: %s is the contact-us URL.
							__( 'To update your email address, please <a href="%s">contact us</a>.', 'newspack-plugin' ),
							'#'
						)
					);
					?>
				</span>
			</p>

			<p class="woocommerce-buttons-card">
				<button
					type="submit"
					class="woocommerce-Button button primary newspack-ui__button--wide-on-mobile"
				>
					<span><?php esc_html_e( 'Update profile', 'newspack-plugin' ); ?></span>
				</button>
			</p>
		</form>
	</section>

	<section id="account-password">
		<h4 class="newspack-ui__font--m"><?php esc_html_e( 'Password', 'newspack-plugin' ); ?></h4>
		<form class="woocommerce-ResetPassword lost_reset_password" data-action="update-password">
			<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
				<label for="current_password"><?php esc_html_e( 'Current password', 'newspack-plugin' ); ?></label>
				<input
					type="password"
					class="woocommerce-Input woocommerce-Input--text input-text"
					name="current_password"
					id="current_password"
				/>
			</p>
			<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
				<label for="password_1"><?php esc_html_e( 'New password', 'newspack-plugin' ); ?></label>
				<input
					type="password"
					class="woocommerce-Input woocommerce-Input--text input-text"
					name="password_1"
					id="password_1"
					autocomplete="new-password"
				/>
				<span class="legend"><?php esc_html_e( 'Your new password must be more than 12 characters.', 'newspack-plugin' ); ?></span>
			</p>

			<p class="woocommerce-buttons-card">
				<button
					type="submit"
					class="woocommerce-Button button primary newspack-ui__button--wide-on-mobile"
				>
					<span><?php esc_html_e( 'Update password', 'newspack-plugin' ); ?></span>
				</button>
				<a class="woocommerce-Button button ghost newspack-ui__button--wide-on-mobile" href="#" data-action="forgot-password">
					<?php esc_html_e( 'Forgot password', 'newspack-plugin' ); ?>
				</a>
			</p>
		</form>
	</section>

	<section id="delete-account">
		<h4 class="newspack-ui__font--m is-destructive"><?php esc_html_e( 'Delete account', 'newspack-plugin' ); ?></h4>
		<p>
			<?php esc_html_e( 'Please note, account deletion is final, and there will be no way to restore your account.', 'newspack-plugin' ); ?>
		</p>
		<p class="woocommerce-buttons-card">
			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--destructive newspack-ui__button--wide-on-mobile"
				data-action="delete-account"
			>
				<span><?php esc_html_e( 'Delete account', 'newspack-plugin' ); ?></span>
			</button>
		</p>
	</section>
</div>

<?php
load_template(
	__DIR__ . '/partials/delete-account-modal.php',
	false,
	[
		'email' => $email,
		'data'  => $data,
	]
);
