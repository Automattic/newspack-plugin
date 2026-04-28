<?php
/**
 * My Account v2 prototype — Cancel subscription modal partial.
 *
 * Two visual steps in one modal container:
 *  - init    (Figma 2636:46259) — "Are you sure?" body + destructive
 *                                 confirm + ghost "Keep subscription".
 *  - success (Figma 2636:46262) — green-check success box + email-sent
 *                                 line + "Done" close button.
 *
 * Markup mirrors the v1/newspack-ui modal conventions (per brief §2.1.1):
 * `.newspack-ui__modal-container` → overlay → `.newspack-ui__modal--small`
 * → `__header` (h2 + close button) → `.newspack-ui__modal__content`. Action
 * buttons render directly inside `__content` (NOT `__footer`, which has the
 * grey neutral-5 background that clashes with the design — same call as
 * Phase 4's change-subscription modal). Success state uses
 * `.newspack-ui__box--success.--text-center` + `__icon--success` + check
 * SVG, matching the canonical pattern in `class-newspack-ui.php`.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `subscription` => the subscription row this modal is for
 *                                      (id, status, expires_on, next_payment).
 *                  - `reader_email` => email address surfaced in the success
 *                                      copy (matches the page-level fake data).
 */

defined( 'ABSPATH' ) || exit;

$subscription    = isset( $args['subscription'] ) ? $args['subscription'] : [];
$reader_email    = isset( $args['reader_email'] ) ? (string) $args['reader_email'] : '';
$subscription_id = isset( $subscription['id'] ) ? (string) $subscription['id'] : '';

// "active until X" date: prefer next_payment for actively-renewing subs; fall
// back to expires_on for the expiring variant. Either way the source is the
// fake-data fixture, formatted with WP's locale-aware date helper.
$end_iso = '';
if ( ! empty( $subscription['next_payment'] ) ) {
	$end_iso = (string) $subscription['next_payment'];
} elseif ( ! empty( $subscription['expires_on'] ) ) {
	$end_iso = (string) $subscription['expires_on'];
}
$end_date_label = '';
if ( '' !== $end_iso ) {
	$end_ts         = strtotime( $end_iso );
	$end_date_label = $end_ts ? date_i18n( 'F j, Y', $end_ts ) : $end_iso;
}
?>
<div
	id="newspack-my-account__cancel-subscription-<?php echo esc_attr( $subscription_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account__v2-demo-cancel-subscription"
	data-state="closed"
	data-newspack-my-account-v2-demo="cancel-subscription-modal"
	data-subscription-id="<?php echo esc_attr( $subscription_id ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Cancel subscription', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content" data-step="init">
			<h3><?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?></h3>
			<?php if ( '' !== $end_date_label ) : ?>
				<p>
					<?php
					echo wp_kses(
						sprintf(
							/* translators: %s: end-of-access date in <strong>. */
							__( 'If you cancel now, your subscription will remain active until %s.', 'newspack-plugin' ),
							'<strong>' . esc_html( $end_date_label ) . '</strong>'
						),
						[ 'strong' => [] ]
					);
					?>
				</p>
			<?php endif; ?>
			<p><?php esc_html_e( 'After this, your subscription access will end unless you choose to renew.', 'newspack-plugin' ); ?></p>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--destructive newspack-ui__button--wide"
				data-action="confirm"
			>
				<?php esc_html_e( 'Cancel subscription', 'newspack-plugin' ); ?>
			</button>
			<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Keep subscription', 'newspack-plugin' ); ?>
			</button>
		</div>

		<div class="newspack-ui__modal__content" data-step="success" hidden>
			<div class="newspack-ui__box newspack-ui__box--success newspack-ui__box--text-center">
				<span class="newspack-ui__icon newspack-ui__icon--success">
					<?php \Newspack\Newspack_UI_Icons::print_svg( 'check' ); ?>
				</span>
				<p>
					<strong><?php esc_html_e( 'Your subscription has been successfully cancelled.', 'newspack-plugin' ); ?></strong>
				</p>
				<?php if ( '' !== $reader_email ) : ?>
					<p>
						<?php
						echo wp_kses(
							sprintf(
								/* translators: %s: reader email address in <strong>. */
								__( 'We have just sent a confirmation email to %s.', 'newspack-plugin' ),
								'<strong>' . esc_html( $reader_email ) . '</strong>'
							),
							[ 'strong' => [] ]
						);
						?>
					</p>
				<?php endif; ?>
			</div>

			<button type="button" class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Done', 'newspack-plugin' ); ?>
			</button>
		</div>
	</div>
</div>
