<?php
/**
 * My Account v2 prototype — Cancel donation modal partial.
 *
 * Two visual steps:
 *  - init    (Figma 2636:46591) — "Are you sure?" body + destructive
 *                                 confirm + ghost "Keep donation".
 *  - success (Figma 2636:46550) — green-check success box + email-sent
 *                                 line + "Done" close button.
 *
 * Mirrors the cancel-subscription confirmation pattern; only copy + the
 * resource keying differ.
 *
 * @package Newspack
 * @var array $args Template args; expected keys:
 *                  - `donation`     => the donation row (id).
 *                  - `reader_email` => email surfaced in the success copy.
 */

defined( 'ABSPATH' ) || exit;

$donation     = isset( $args['donation'] ) ? $args['donation'] : [];
$reader_email = isset( $args['reader_email'] ) ? (string) $args['reader_email'] : '';
$donation_id  = isset( $donation['id'] ) ? (string) $donation['id'] : '';
?>
<div
	id="newspack-my-account__cancel-donation-<?php echo esc_attr( $donation_id ); ?>"
	class="newspack-ui newspack-ui__modal-container newspack-my-account-v2-demo-cancel-donation"
	data-state="closed"
	data-newspack-my-account-v2-demo="cancel-donation-modal"
	data-donation-id="<?php echo esc_attr( $donation_id ); ?>"
>
	<div class="newspack-ui__modal-container__overlay"></div>
	<div class="newspack-ui__modal newspack-ui__modal--small">
		<header class="newspack-ui__modal__header">
			<h2><?php esc_html_e( 'Cancel donation', 'newspack-plugin' ); ?></h2>
			<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close" type="button">
				<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
				<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</header>

		<div class="newspack-ui__modal__content" data-step="init">
			<h3><?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?></h3>
			<p><?php esc_html_e( 'We appreciate your generous support, even if you can no longer donate at this time.', 'newspack-plugin' ); ?></p>

			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--destructive newspack-ui__button--wide"
				data-action="confirm"
			>
				<?php esc_html_e( 'Cancel donation', 'newspack-plugin' ); ?>
			</button>
			<button type="button" class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--wide newspack-ui__modal__close">
				<?php esc_html_e( 'Keep donation', 'newspack-plugin' ); ?>
			</button>
		</div>

		<div class="newspack-ui__modal__content" data-step="success" hidden>
			<div class="newspack-ui__box newspack-ui__box--success newspack-ui__box--text-center">
				<span class="newspack-ui__icon newspack-ui__icon--success">
					<?php \Newspack\Newspack_UI_Icons::print_svg( 'check' ); ?>
				</span>
				<p>
					<strong><?php esc_html_e( 'Your donation has been successfully cancelled.', 'newspack-plugin' ); ?></strong>
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
