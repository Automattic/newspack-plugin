<?php
/**
 * My Account v2 prototype — Delete account modal.
 *
 * Two-step flow:
 *   - init: "Are you sure?" prose + action list pointing the reader at the
 *     three "soft" alternatives (Manage donations / Manage subscriptions /
 *     Manage newsletters), plus Delete account / Cancel buttons.
 *   - success: "Your account deletion has been requested." + we just sent
 *     instructions to {email}.
 *
 * @package Newspack
 * @var array $args Template args; expected keys: `email`, `data`.
 */

defined( 'ABSPATH' ) || exit;

use Newspack\Newspack_UI_Icons;

$email = isset( $args['email'] ) ? (string) $args['email'] : '';

// Build the three "alternatives" rows. Each row links to the corresponding
// v2-demo endpoint with the demo flag preserved by the existing endpoint-URL
// filter.
$alternatives = [
	[
		'title'       => __( 'Donations', 'newspack-plugin' ),
		'description' => __( 'Review and cancel any recurring donation.', 'newspack-plugin' ),
		'cta_label'   => __( 'Manage donations', 'newspack-plugin' ),
		'url'         => wc_get_account_endpoint_url( 'donations' ),
	],
	[
		'title'       => __( 'Subscriptions', 'newspack-plugin' ),
		'description' => __( 'Review and cancel any active subscription.', 'newspack-plugin' ),
		'cta_label'   => __( 'Manage subscriptions', 'newspack-plugin' ),
		'url'         => wc_get_account_endpoint_url( 'subscriptions' ),
	],
	[
		'title'       => __( 'Newsletters', 'newspack-plugin' ),
		'description' => __( 'Update your newsletter preferences.', 'newspack-plugin' ),
		'cta_label'   => __( 'Manage newsletters', 'newspack-plugin' ),
		'url'         => wc_get_account_endpoint_url( 'newsletters' ),
	],
];
?>
<div
	class="newspack-ui__modal-container"
	id="newspack-my-account__delete-account"
	data-state="closed"
	data-newspack-my-account-v2-demo="delete-account-modal"
>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<div class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Delete account', 'newspack-plugin' ); ?></h2>
			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--icon newspack-ui__modal__close"
				aria-label="<?php esc_attr_e( 'Close modal', 'newspack-plugin' ); ?>"
			>
				<?php Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</div>

		<div class="newspack-ui__modal__content" data-step="init">
			<h3 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0"><?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?></h3>
			<p>
				<?php esc_html_e( 'Deleting your account is permanent and cannot be undone. All your data will be removed from our systems. Your newsletter subscriptions and all recurring payments will be cancelled.', 'newspack-plugin' ); ?>
			</p>
			<p>
				<?php esc_html_e( 'Instead of deleting your account, you may want to:', 'newspack-plugin' ); ?>
			</p>

			<ul class="newspack-my-account-v2-demo-account-settings__alternatives">
				<?php foreach ( $alternatives as $alternative ) : ?>
					<li class="newspack-my-account-v2-demo-account-settings__alternatives-item">
						<div class="newspack-my-account-v2-demo-account-settings__alternatives-details">
							<strong><?php echo esc_html( $alternative['title'] ); ?></strong>
							<span><?php echo esc_html( $alternative['description'] ); ?></span>
						</div>
						<a
							href="<?php echo esc_url( $alternative['url'] ); ?>"
							class="newspack-ui__button newspack-ui__button--secondary"
						>
							<?php echo esc_html( $alternative['cta_label'] ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>

			<div class="newspack-ui__stack newspack-ui__stack--vertical newspack-ui__stack--gap-3">
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--destructive"
					data-action="confirm-delete-account"
				>
					<span><?php esc_html_e( 'Delete account', 'newspack-plugin' ); ?></span>
				</button>
				<button
					type="button"
					class="newspack-ui__button newspack-ui__button--ghost newspack-ui__modal__close"
				>
					<?php esc_html_e( 'Cancel', 'newspack-plugin' ); ?>
				</button>
			</div>
		</div>

		<div class="newspack-ui__modal__content" data-step="success" hidden>
			<div class="newspack-ui__box newspack-ui__box--text-center">
				<div class="newspack-my-account-v2-demo-account-settings__success-icon" aria-hidden="true">
					<?php Newspack_UI_Icons::print_svg( 'emailSend' ); ?>
				</div>
				<p class="newspack-ui__font--bold">
					<?php esc_html_e( 'Your account deletion has been requested.', 'newspack-plugin' ); ?>
				</p>
				<p>
					<?php
					printf(
						/* translators: %s is the reader's email address. */
						esc_html__( 'We have just sent instructions on how to delete your account to %s.', 'newspack-plugin' ),
						'<strong>' . esc_html( $email ) . '</strong>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					);
					?>
				</p>
			</div>
		</div>
	</div>
</div>
