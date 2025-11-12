<?php
/**
 * My Account navigation menu.
 *
 * @package Newspack
 */

use Newspack;
use Newspack\Newspack_UI_Icons;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_before_account_navigation' );
$site_icon_url = apply_filters( 'newspack_my_account_site_logo_url', get_site_icon_url( 96 ) );
?>

<div class="newspack-my-account__navigation-topbar">
	<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="newspack-my-account__home-link"><?php _e( 'Back to Homepage', 'newspack-plugin' ); ?></a>
	<button class="newspack-my-account__icon-button newspack-my-account__icon-button--open-navigation">
		<span class="screen-reader-text"><?php _e( 'Open navigation', 'newspack-plugin' ); ?></span>
	</button>
</div>

<nav class="woocommerce-MyAccount-navigation newspack-ui" aria-label="<?php esc_attr_e( 'Account pages', 'newspack-plugin' ); ?>">
	<header>
		<button class="newspack-my-account__icon-button newspack-my-account__icon-button--close-navigation">
			<span class="screen-reader-text"><?php _e( 'Close navigation', 'newspack-plugin' ); ?></span>
		</button>
		<?php if ( ! empty( $site_icon_url ) ) : ?>
		<a class="newspack-my-account__site-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php esc_attr_e( 'Back to Homepage', 'newspack-plugin' ); ?>">
			<img src="<?php echo esc_url( $site_icon_url ); ?>" />
		</a>
		<?php endif; ?>

		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="newspack-my-account__home-link newspack-ui__button newspack-ui__button--small newspack-ui__button--ghost-light">
			<?php Newspack_UI_Icons::print_svg( 'chevronLeft' ); ?>
			<?php _e( 'Back to Homepage', 'newspack-plugin' ); ?>
		</a>

		<ul>
			<?php foreach ( wc_get_account_menu_items() as $endpoint => $label ) : ?>
				<li class="<?php echo esc_attr( wc_get_account_menu_item_classes( $endpoint ) ); ?>">
					<a href="<?php echo esc_url( wc_get_account_endpoint_url( $endpoint ) ); ?>" <?php echo wc_is_current_account_menu_item( $endpoint ) ? 'aria-current="page"' : ''; ?> class="newspack-ui__button newspack-ui__button--small <?php echo wc_is_current_account_menu_item( $endpoint ) ? 'newspack-ui__button--accent' : 'newspack-ui__button--ghost'; ?>">
						<?php echo esc_html( $label ); ?>
					</a>
				</li>
			<?php endforeach; ?>
		</ul>
	</header>

	<footer class="newspack-my-account__navigation-footer">
		<ul>
			<?php foreach ( apply_filters( 'newspack_my_account_navigation_footer_items', [] ) as $item ) : ?>
				<li class="newspack-my-account__navigation-footer-item">
					<a href="<?php echo esc_url( $item['url'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
				</li>
			<?php endforeach; ?>
			<li class="<?php echo esc_attr( wc_get_account_menu_item_classes( 'customer-logout' ) ); ?>">
				<a href="<?php echo esc_url( wp_logout_url( wc_get_account_endpoint_url( 'customer-logout' ) ) ); ?>" class="newspack-ui__button newspack-ui__button--small newspack-ui__button--ghost">
					<?php _e( 'Sign out', 'newspack-plugin' ); ?>
					<?php Newspack_UI_Icons::print_svg( 'logout' ); ?>
				</a>
			</li>
		</ul>
	</footer>
</nav>

<?php do_action( 'woocommerce_after_account_navigation' ); ?>
