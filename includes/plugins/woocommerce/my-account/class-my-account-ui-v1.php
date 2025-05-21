<?php
/**
 * Newspack "My Account" customizations v1.x.x.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation;
use Newspack\WooCommerce_Connection;
use Newspack\WooCommerce_My_Account;
use Newspack\Newspack_UI;
use Newspack\Newspack_UI_Icons;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack "My Account" customizations v1.x.x.
 */
class My_Account_UI_V1 {
	const RESET_PASSWORD_ACTION = 'newspack_my_account_reset_password';
	const RESET_PASSWORD_URL_PARAM = 'newspack-reset-password';

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		\add_filter( 'page_template', [ __CLASS__, 'page_template' ] );
		\add_filter( 'body_class', [ __CLASS__, 'add_body_class' ] );
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ], 11 );
		\add_filter( 'wc_get_template', [ __CLASS__, 'wc_get_template' ], 10, 5 );
		\add_filter( 'woocommerce_account_menu_items', [ __CLASS__, 'my_account_menu_items' ], 1001 );
		\add_filter( 'newspack_myaccount_required_fields', [ __CLASS__, 'account_settings_required_fields' ] );
		\add_action( 'wp_loaded', [ __CLASS__, 'maybe_generate_password_reset_key' ] );
		\add_action( 'template_redirect', [ __CLASS__, 'redirect_reset_password_link' ], 11 );
		\add_filter( 'validate_password_reset', [ __CLASS__, 'validate_password_reset' ], 10, 2 );
		\add_action( 'wp_loaded', [ __CLASS__, 'maybe_password_reset_success' ] );
		\add_action( 'newspack_woocommerce_after_edit_account_form', [ __CLASS__, 'add_reset_password_modal' ] );
		\add_action( 'newspack_woocommerce_after_edit_account_form', [ __CLASS__, 'delete_account_modal' ] );
		\add_action( 'newspack_after_delete_account', [ __CLASS__, 'handle_after_delete_account' ] );
		\add_action( 'wp_footer', [ __CLASS__, 'add_after_delete_account_notice' ] );
		\add_action( 'woocommerce_subscription_details_table', [ __CLASS__, 'cancel_subscription_modal' ] );
	}

	/**
	 * Render My Account pages with a no-header/no-footer page template.
	 *
	 * @param string $template The template.
	 * @return string The template file path.
	 */
	public static function page_template( $template ) {
		if ( function_exists( 'is_account_page' ) && \is_account_page() && \is_user_logged_in() ) {
			return __DIR__ . '/templates/v1/my-account.php';
		}
		return $template;
	}

	/**
	 * Add a body class to the My Account page.
	 *
	 * @param array $classes The body classes.
	 * @return array The body classes.
	 */
	public static function add_body_class( $classes ) {
		if ( function_exists( 'is_account_page' ) && \is_account_page() ) {
			$classes[] = 'newspack-ui';
			$classes[] = 'newspack-my-account';
			$classes[] = 'newspack-my-account--v1';
			if ( ! \is_user_logged_in() ) {
				$classes[] = 'newspack-my-account--logged-out';
			} else {
				$classes[] = 'newspack-my-account--logged-in';
			}
		}
		return $classes;
	}

	/**
	 * Enqueue assets.
	 */
	public static function enqueue_assets() {
		if ( function_exists( 'is_account_page' ) && \is_account_page() ) {
			\wp_enqueue_script(
				'my-account-v1',
				\Newspack\Newspack::plugin_url() . '/dist/my-account-v1.js',
				[ 'my-account' ],
				NEWSPACK_PLUGIN_VERSION,
				true
			);

			// Dequeue styles from the Newspack theme first, for a fresh start.
			\wp_dequeue_style( 'newspack-woocommerce-style' );
			\wp_enqueue_style(
				'my-account-v1',
				\Newspack\Newspack::plugin_url() . '/dist/my-account-v1.css',
				[],
				NEWSPACK_PLUGIN_VERSION
			);
		}
	}

	/**
	 * WC's page templates hijacking.
	 *
	 * @param string $template      Template path.
	 * @param string $template_name Template name.
	 */
	public static function wc_get_template( $template, $template_name ) {
		switch ( $template_name ) {
			case 'myaccount/navigation.php':
				return __DIR__ . '/templates/v1/navigation.php';
			case 'myaccount/form-edit-account.php':
				return __DIR__ . '/templates/v1/account-settings.php';
			default:
				return $template;
		}
	}

	/**
	 * Modify nav menu items.
	 *
	 * @param array $items Menu items.
	 * @return array Modified menu items.
	 */
	public static function my_account_menu_items( $items ) {
		// Remove logout menu item (to be replaced in our custom template).
		unset( $items['customer-logout'] );
		return $items;
	}

	/**
	 * Remove required fields from the account settings form.
	 *
	 * @param array $required_fields The required fields.
	 * @return array The required fields.
	 */
	public static function account_settings_required_fields( $required_fields ) {
		unset( $required_fields['account_display_name'] );
		return $required_fields;
	}

	/**
	 * Intercept a password reset request from Account Settings page.
	 * The key must be generated before the user's password can be reset,
	 * but not before submitting the form, otherwise it will break the Forgot Password flow.
	 */
	public static function maybe_generate_password_reset_key() {
		// Only if the user is logged in and a reader.
		$user = \wp_get_current_user();
		if ( ! \is_user_logged_in() || ! Reader_Activation::is_user_reader( $user ) ) {
			return;
		}

		// Only if updating password from Account Settings page.
		$action = filter_input( INPUT_POST, 'action', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$nonce  = filter_input( INPUT_POST, 'woocommerce-reset-password-nonce', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( self::RESET_PASSWORD_ACTION !== $action || empty( $nonce ) ) {
			return;
		}

		// Generate a password reset key.
		$key   = \get_password_reset_key( $user );
		$login = $user->data->user_login;
		if ( \is_wp_error( $key ) ) {
			return;
		}

		// Pass the key and login to the posted data.
		$_POST['reset_key']   = $key;
		$_POST['reset_login'] = $login;
	}

	/**
	 * Check if the user has a valid password reset key.
	 *
	 * @return bool True if the user has a valid password reset key, false otherwise.
	 */
	public static function check_password_reset_key() {
		if ( isset( $_COOKIE[ 'wp-resetpass-' . COOKIEHASH ] ) && 0 < strpos( $_COOKIE[ 'wp-resetpass-' . COOKIEHASH ], ':' ) ) {  // @codingStandardsIgnoreLine
			list( $rp_id, $rp_key ) = array_map( 'wc_clean', explode( ':', \wp_unslash( $_COOKIE[ 'wp-resetpass-' . COOKIEHASH ] ), 2 ) ); // @codingStandardsIgnoreLine
			$userdata               = \get_userdata( absint( $rp_id ) );
			$rp_login               = $userdata ? $userdata->user_login : '';
			$user                   = \check_password_reset_key( $rp_key, $rp_login );

			if ( is_a( $user, 'WP_User' ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Redirect the user to the Account Settings page to reset their password via a custom modal.
	 */
	public static function redirect_reset_password_link() {
		if ( function_exists( 'is_account_page' ) && \is_account_page() && \is_user_logged_in() && filter_input( INPUT_GET, 'show-reset-form', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) && self::check_password_reset_key() ) {
			\wp_safe_redirect(
				\add_query_arg(
					self::RESET_PASSWORD_URL_PARAM,
					\wp_create_nonce( 'newspack_my_account_reset_password' ),
					\wc_get_account_endpoint_url( 'edit-account' )
				)
			);
			exit;
		}
	}

	/**
	 * Validate new reader password before being saved.
	 *
	 * @param WP_Error $errors Errors object.
	 * @param WP_User  $user   The user object.
	 *
	 * @return array
	 */
	public static function validate_password_reset( $errors, $user ) {
		// Only if the user is logged in and a reader.
		if ( ! \is_user_logged_in() || ! Reader_Activation::is_user_reader( $user ) ) {
			return $errors;
		}

		// Only if updating password from Account Settings page.
		$action = filter_input( INPUT_POST, 'action', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( self::RESET_PASSWORD_ACTION !== $action ) {
			return $errors;
		}

		// If resetting via the email-based flow, skip the password check.
		$reset_password = filter_input( INPUT_GET, self::RESET_PASSWORD_URL_PARAM, FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( $reset_password ) {
			return $errors;
		}

		// Check if the current password is correct.
		$is_without_password = Reader_Activation::is_reader_without_password( $user );
		$current_password    = filter_input( INPUT_POST, 'current_password', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( ! $is_without_password && empty( $current_password ) ) {
			$errors->add( 'missing_current_password', __( 'Please enter your current password.', 'newspack-plugin' ) );
			return $errors;
		}
		$password_check = $is_without_password || \wp_check_password( $current_password, $user->data->user_pass, $user->ID );
		if ( ! $password_check ) {
			$errors->add( 'invalid_current_password', __( 'Invalid current password.', 'newspack-plugin' ) );
			return $errors;
		}

		return $errors;
	}

	/**
	 * Display a success notice if the password was updated.
	 */
	public static function maybe_password_reset_success() {
		if ( \is_user_logged_in() && filter_input( INPUT_GET, 'password-reset', FILTER_VALIDATE_BOOLEAN ) ) {
			\wc_add_notice( __( 'Password updated.', 'newspack-plugin' ), 'success' );
		}
	}

	/**
	 * Display a modal to reset the user's password.
	 */
	public static function add_reset_password_modal() {
		// Only if the user is logged in and a reader.
		if ( ! \is_user_logged_in() || ! Reader_Activation::is_user_reader( \wp_get_current_user() ) ) {
			return;
		}

		// If the user has clicked the button from the reset password email, show the modal.
		$reset_password = filter_input( INPUT_GET, self::RESET_PASSWORD_URL_PARAM, FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( ! $reset_password || ! \wp_verify_nonce( $reset_password, 'newspack_my_account_reset_password' ) ) {
			return;
		}

		ob_start();
		?>
		<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
			<label for="password_1"><?php esc_html_e( 'New password', 'newspack-plugin' ); ?>&nbsp;<span class="required" aria-hidden="true">*</span><span class="screen-reader-text"><?php esc_html_e( 'Required', 'newspack-plugin' ); ?></span></label>
			<input
				type="password"
				class="woocommerce-Input woocommerce-Input--text input-text"
				name="password_1"
				id="password_1"
				autocomplete="new-password"
				required
				aria-required="true"
			/>
		</p>
		<p class="woocommerce-form-row woocommerce-form-row--wide form-row form-row-wide">
			<label for="password_2"><?php esc_html_e( 'Re-enter new password', 'newspack-plugin' ); ?>&nbsp;<span class="required" aria-hidden="true">*</span><span class="screen-reader-text"><?php esc_html_e( 'Required', 'newspack-plugin' ); ?></span></label>
			<input
				type="password"
				class="woocommerce-Input woocommerce-Input--text input-text"
				name="password_2"
				id="password_2"
				autocomplete="new-password"
				required
				aria-required="true"
			/>
		</p>

		<?php do_action( 'newspack_woocommerce_resetpassword_form' ); ?>

		<input type="hidden" name="wc_reset_password" value="true" />
		<input type="hidden" name="action" value="<?php echo \esc_attr( self::RESET_PASSWORD_ACTION ); ?>" />

		<?php wp_nonce_field( 'reset_password', 'woocommerce-reset-password-nonce' ); ?>

		<?php
		$content = ob_get_clean();
		$user    = \wp_get_current_user();
		$action  = filter_input( INPUT_POST, 'action', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

		Newspack_UI::generate_modal(
			[
				'id'         => 'reset-password-modal',
				'title'      => Reader_Activation::is_reader_without_password( $user ) ? __( 'Set password', 'newspack-plugin' ) : __( 'Reset password', 'newspack-plugin' ),
				'content'    => $content,
				'size'       => 'small',
				'form'       => 'POST',
				'form_class' => 'lost_reset_password',
				'state'      => self::RESET_PASSWORD_ACTION === $action ? 'closed' : 'open',
				'actions'    => [
					'continue' => [
						'label' => __( 'Save password', 'newspack-plugin' ),
						'type'  => 'primary',
					],
					'cancel'   => [
						'label'  => __( 'Cancel', 'newspack-plugin' ),
						'type'   => 'ghost',
						'action' => 'close',
					],
				],
			]
		);
	}

	/**
	 * Display a series of modals to request account deletion.
	 */
	public static function delete_account_modal() {
		// Only if the user is logged in and a reader.
		if ( ! \is_user_logged_in() || ! Reader_Activation::is_user_reader( \wp_get_current_user() ) ) {
			return;
		}

		// If the user has clicked the button from the delete account email, show the confirmation modal.
		$delete_account_form = filter_input( INPUT_GET, WooCommerce_My_Account::DELETE_ACCOUNT_FORM, FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		if ( ! empty( $delete_account_form ) ) {
			return self::delete_account_confirmation_modal();
		}

		ob_start();
		?>
		<h2 class="font-size newspack-ui__font--l">
			<?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?>
		</h2>
		<p>
			<?php
			esc_html_e( 'Deleting your account is permanent and cannot be undone. All your data will be removed from our systems. Your newsletter subscriptions and all recurring payments will be cancelled.', 'newspack-plugin' );
			?>
		</p>
		<p>
			<?php
			esc_html_e( 'Instead of deleting your account, you may want to:', 'newspack-plugin' );
			?>
		</p>
		<div class="newspack-ui__row">
			<div>
				<p class="font-size newspack-ui__font--s newspack-ui__font--bold"><?php esc_html_e( 'Subscriptions', 'newspack-plugin' ); ?></p>
				<p class="newspack-ui__helper-text"><?php esc_html_e( 'Review and cancel active subscriptions.', 'newspack-plugin' ); ?></p>
			</div>
			<div class="newspack-ui__width--33">
				<a class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--wide" href="<?php echo esc_url( \wc_get_endpoint_url( 'subscriptions', '', \wc_get_page_permalink( 'myaccount' ) ) ); ?>">
					<?php esc_html_e( 'Manage subscriptions', 'newspack-plugin' ); ?>
				</a>
			</div>
		</div>
		<div class="newspack-ui__row">
			<div>
				<p class="font-size newspack-ui__font--s newspack-ui__font--bold"><?php esc_html_e( 'Newsletters', 'newspack-plugin' ); ?></p>
				<p class="newspack-ui__helper-text"><?php esc_html_e( 'Update your newsletter preferences.', 'newspack-plugin' ); ?></p>
			</div>
			<div class="newspack-ui__width--33">
				<a class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--wide" href="<?php echo esc_url( \wc_get_endpoint_url( 'newsletters', '', \wc_get_page_permalink( 'myaccount' ) ) ); ?>">
					<?php esc_html_e( 'Manage newsletters', 'newspack-plugin' ); ?>
				</a>
			</div>
		</div>
		<?php
		$content_send_email = ob_get_clean();

		// Modal to send the delete account email.
		Newspack_UI::generate_modal(
			[
				'id'      => 'delete-account',
				'title'   => __( 'Delete account', 'newspack-plugin' ),
				'content' => $content_send_email,
				'size'    => 'medium',
				'actions' => [
					'confirm' => [
						'label' => __( 'Delete account', 'newspack-plugin' ),
						'type'  => 'destructive',
						'fetch' => [
							'url'    => \rest_url( 'newspack/v1/delete-account' ),
							'method' => 'POST',
							'next'   => 'delete-account-email-sent',
							'nonce'  => \wp_create_nonce( 'wp_rest' ),
							'body'   => [
								'user_id' => \wp_get_current_user()->ID,
							],
						],
					],
					'cancel'  => [
						'label'  => __( 'Cancel', 'newspack-plugin' ),
						'type'   => 'ghost',
						'action' => 'close',
					],
				],
			]
		);

		ob_start();
		?>
		<div class="newspack-ui__box newspack-ui__box--text-center">
			<span class="newspack-ui__icon newspack-ui__icon--neutral">
				<?php Newspack_UI_Icons::print_svg( 'email' ); ?>
			</span>
			<p>
				<strong><?php esc_html_e( 'Your account deletion has been requested.', 'newspack-plugin' ); ?></strong>
			</p>
			<p><?php esc_html_e( 'We just sent instructions on how to delete your account to', 'newspack-plugin' ); ?> <strong><?php echo esc_html( \wp_get_current_user()->user_email ); ?></strong>.</p>
		</div>
		<?php
		$content_email_sent = ob_get_clean();

		// Modal to confirm that the email was sent.
		Newspack_UI::generate_modal(
			[
				'id'      => 'delete-account-email-sent',
				'title'   => __( 'Delete account', 'newspack-plugin' ),
				'content' => $content_email_sent,
				'size'    => 'small',
				'actions' => [
					'continue' => [
						'label'  => __( 'Continue', 'newspack-plugin' ),
						'type'   => 'primary',
						'action' => 'close',
					],
				],
			]
		);
	}

	/**
	 * Display a confirmation modal to confirm account deletion.
	 */
	public static function delete_account_confirmation_modal() {
		$delete_account_form = WooCommerce_My_Account::DELETE_ACCOUNT_FORM;
		$nonce_value         = filter_input( INPUT_GET, $delete_account_form, FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$token               = filter_input( INPUT_GET, 'token', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$transient_token     = \get_transient( 'np_reader_account_delete_' . \get_current_user_id() );
		if ( ! \wp_verify_nonce( $nonce_value, $delete_account_form ) ) {
			WooCommerce_Connection::add_wc_notice( __( 'Invalid nonce.', 'newspack-plugin' ), 'error' );
			return;
		}
		if ( ! $token || ! $transient_token || $transient_token !== $token ) {
			WooCommerce_Connection::add_wc_notice( __( 'Invalid token.', 'newspack-plugin' ), 'error' );
			return;
		}
		ob_start();
		?>
		<h2 class="font-size newspack-ui__font--l">
			<?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?>
		</h2>
		<p>
			<?php esc_html_e( 'Confirm to delete your account permanently.', 'newspack-plugin' ); ?>&nbsp;
			<strong><?php esc_html_e( 'Caution, this action is irreversible!', 'newspack-plugin' ); ?></strong>
		</p>
		<input type="hidden" name="<?php echo \esc_attr( $delete_account_form ); ?>" value="<?php echo \esc_attr( $nonce_value ); ?>">
		<input type="hidden" name="token" value="<?php echo \esc_attr( $token ); ?>">
		<input type="hidden" name="confirm_delete" value="1" />
		<?php
		$content = ob_get_clean();

		// Modal to confirm that the email was sent.
		Newspack_UI::generate_modal(
			[
				'id'      => 'delete-account',
				'title'   => __( 'Delete account', 'newspack-plugin' ),
				'content' => $content,
				'size'    => 'small',
				'form'    => 'POST',
				'state'   => 'open',
				'actions' => [
					'continue' => [
						'label' => __( 'Delete account', 'newspack-plugin' ),
						'type'  => 'destructive',
					],
					'cancel'   => [
						'label'  => __( 'Cancel', 'newspack-plugin' ),
						'type'   => 'ghost',
						'action' => 'close',
					],
				],
			]
		);
	}

	/**
	 * Handle after delete account.
	 */
	public static function handle_after_delete_account() {
		\wp_safe_redirect(
			\add_query_arg(
				WooCommerce_My_Account::AFTER_ACCOUNT_DELETION_PARAM,
				1,
				\home_url()
			)
		);
		exit;
	}

	/**
	 * Show a notice after the account is deleted.
	 */
	public static function add_after_delete_account_notice() {
		$account_deleted = filter_input( INPUT_GET, WooCommerce_My_Account::AFTER_ACCOUNT_DELETION_PARAM, FILTER_VALIDATE_BOOLEAN );
		if ( $account_deleted ) {
			?>
			<div class="newspack-ui">
				<div class="newspack-ui__snackbar newspack-ui__snackbar--top-right newspack-ui__snackbar--success active-on-load">
					<?php esc_html_e( 'Your account has been successfully deleted.', 'newspack-plugin' ); ?>
				</div>
			</div>
			<?php
		}
	}

	/**
	 * Confirmation modal to cancel a subscription.
	 * Rendered when viewing a single subscription page.
	 *
	 * @param WC_Subscription $subscription The subscription.
	 */
	public static function cancel_subscription_modal( $subscription ) {
		// Only if the user is logged in and a reader.
		if ( ! \is_user_logged_in() || ! Reader_Activation::is_user_reader( \wp_get_current_user() ) ) {
			return;
		}

		if ( ! $subscription || ! is_a( $subscription, 'WC_Subscription' ) ) {
			return;
		}
		$next_payment = $subscription->get_time( 'next_payment' );
		if (
			// See: wcs_get_all_user_actions_for_subscription().
			$subscription->can_be_updated_to( 'cancelled' ) && ! $subscription->is_one_payment() &&
			(
				( $subscription->has_status( 'on-hold' ) && empty( $next_payment ) ) ||
				$next_payment > 0
			)
		) {
			$next_payment_date = $next_payment ? $subscription->get_date_to_display( 'next_payment' ) : null;
			ob_start();
			?>
			<h2 class="font-size newspack-ui__font--l">
				<?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?>
			</h2>
			<p>
				<?php
				echo wp_kses_post(
					sprintf(
					// Translators: %s is either the next payment date, or a generic explanation of when the subscription will end if cancelled.
						__( 'If you cancel now, your subscription will remain active until %s.', 'newspack-plugin' ),
						"<strong>$next_payment_date</strong>" ?? __( 'the end of your current billing period', 'newspack-plugin' )
					)
				);
				?>
			</p>
			<p>
				<?php esc_html_e( 'After this, your subscription access will end unless you choose to renew.', 'newspack-plugin' ); ?>
			</p>
			<?php
			$content = ob_get_clean();
			Newspack_UI::generate_modal(
				[
					'id'      => 'confirm-subscription-cancellation',
					'title'   => __( 'Cancel subscription', 'newspack-plugin' ),
					'content' => $content,
					'actions' => [
						'confirm' => [
							'label' => __( 'Cancel subscription', 'newspack-plugin' ),
							'type'  => 'destructive',
							'url'   => \wcs_get_users_change_status_link( $subscription->get_id(), 'cancelled' ),
						],
						'cancel'  => [
							'label'  => __( 'Keep subscription', 'newspack-plugin' ),
							'type'   => 'ghost',
							'action' => 'close',
						],
					],
				]
			);
		}
	}
}
My_Account_UI_V1::init();
