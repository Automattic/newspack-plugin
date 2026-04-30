<?php
/**
 * My Account v2 prototype — Homepage overlay drawer.
 *
 * Right-side drawer rendered on the homepage when `?my-account-v2-demo` is
 * active. Greeting line is filled in client-side from the browser's local
 * time (see src/my-account-v2-demo-homepage/overlay.js); the first name is
 * server-rendered.
 *
 * @package Newspack
 * @var array $args Template args; expected keys: `first_name`, `menu_items`,
 *                  `secondary_links`, `logout_url`.
 */

defined( 'ABSPATH' ) || exit;

use Newspack\Newspack_UI_Icons;

$first_name      = isset( $args['first_name'] ) ? (string) $args['first_name'] : '';
$menu_items      = isset( $args['menu_items'] ) && is_array( $args['menu_items'] ) ? $args['menu_items'] : [];
$secondary_links = isset( $args['secondary_links'] ) && is_array( $args['secondary_links'] ) ? $args['secondary_links'] : [];
$logout_url      = isset( $args['logout_url'] ) ? (string) $args['logout_url'] : '';
?>
<div
	class="newspack-my-account-v2-demo-homepage-overlay newspack-ui"
	data-newspack-my-account-v2-demo-homepage
	data-state="open"
	role="dialog"
	aria-modal="true"
	aria-label="<?php esc_attr_e( 'My account menu', 'newspack-plugin' ); ?>"
>
	<div class="newspack-my-account-v2-demo-homepage-overlay__drawer">
		<div class="newspack-my-account-v2-demo-homepage-overlay__header">
			<button
				type="button"
				class="newspack-ui__button newspack-ui__button--ghost newspack-ui__button--icon"
				data-close
				aria-label="<?php esc_attr_e( 'Close menu', 'newspack-plugin' ); ?>"
			>
				<?php Newspack_UI_Icons::print_svg( 'close' ); ?>
			</button>
		</div>

		<div class="newspack-my-account-v2-demo-homepage-overlay__welcome">
			<?php if ( '' !== $first_name ) : ?>
				<p class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
					<?php
					printf(
						/* translators: 1: time-of-day greeting placeholder, 2: reader's first name. */
						esc_html__( 'Good %1$s,', 'newspack-plugin' ),
						'<span data-greeting-time></span>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					);
					?>
					<br>
					<?php echo esc_html( $first_name ); ?>.
				</p>
			<?php else : ?>
				<p class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__spacing-top--0 newspack-ui__spacing-bottom--0">
					<?php
					printf(
						/* translators: %s: time-of-day greeting placeholder. */
						esc_html__( 'Good %s.', 'newspack-plugin' ),
						'<span data-greeting-time></span>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					);
					?>
				</p>
			<?php endif; ?>
		</div>

		<nav class="newspack-my-account-v2-demo-homepage-overlay__menu" aria-label="<?php esc_attr_e( 'Account pages', 'newspack-plugin' ); ?>">
			<ul>
				<?php foreach ( $menu_items as $endpoint => $label ) : ?>
					<?php
					// Skip the customer-logout slug — Sign out is rendered as
					// its own footer button below.
					if ( 'customer-logout' === $endpoint ) {
						continue;
					}
					?>
					<li class="<?php echo esc_attr( wc_get_account_menu_item_classes( $endpoint ) ); ?>">
						<a
							href="<?php echo esc_url( wc_get_account_endpoint_url( $endpoint ) ); ?>"
							class="newspack-ui__button newspack-ui__button--small newspack-ui__button--ghost"
						>
							<?php echo esc_html( $label ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</nav>

		<?php if ( ! empty( $secondary_links ) ) : ?>
			<nav class="newspack-my-account-v2-demo-homepage-overlay__secondary" aria-label="<?php esc_attr_e( 'Site information', 'newspack-plugin' ); ?>">
				<ul>
					<?php foreach ( $secondary_links as $item ) : ?>
						<li class="newspack-my-account__navigation-footer-item">
							<a href="<?php echo esc_url( $item['url'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
						</li>
					<?php endforeach; ?>
				</ul>
			</nav>
		<?php endif; ?>

		<div class="newspack-my-account-v2-demo-homepage-overlay__footer">
			<a
				href="<?php echo esc_url( $logout_url ); ?>"
				class="newspack-ui__button newspack-ui__button--small newspack-ui__button--ghost"
			>
				<?php esc_html_e( 'Sign out', 'newspack-plugin' ); ?>
				<?php Newspack_UI_Icons::print_svg( 'logout' ); ?>
			</a>
		</div>
	</div>
</div>
