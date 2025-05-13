<?php
/**
 * My Account navigation menu.
 *
 * @package Newspack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

do_action( 'woocommerce_before_account_navigation' );
?>

<div class="newspack-my-account__navigation-topbar">
	<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="newspack-my-account__home-link"><?php _e( 'Back to Homepage', 'newspack-plugin' ); ?></a>
	<button class="newspack-my-account__icon-button newspack-my-account__icon-button--open-navigation">
		<span class="screen-reader-text"><?php _e( 'Open navigation', 'newspack-plugin' ); ?></span>
	</button>
</div>

<nav class="woocommerce-MyAccount-navigation" aria-label="<?php esc_attr_e( 'Account pages', 'newspack-plugin' ); ?>">
	<button class="newspack-my-account__icon-button newspack-my-account__icon-button--close-navigation">
		<span class="screen-reader-text"><?php _e( 'Close navigation', 'newspack-plugin' ); ?></span>
	</button>
	<a class="newspack-my-account__site-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php esc_attr_e( 'Back to homepage', 'newspack-plugin' ); ?>">
		<img src="<?php echo esc_url( \get_site_icon_url( 96 ) ); ?>" />
	</a>

	<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="newspack-my-account__home-link"><?php _e( 'Back to Homepage', 'newspack-plugin' ); ?></a>

	<ul>
		<?php foreach ( wc_get_account_menu_items() as $endpoint => $label ) : ?>
			<li class="<?php echo esc_attr( wc_get_account_menu_item_classes( $endpoint ) ); ?>">
				<a href="<?php echo esc_url( wc_get_account_endpoint_url( $endpoint ) ); ?>" <?php echo wc_is_current_account_menu_item( $endpoint ) ? 'aria-current="page"' : ''; ?>>
					<?php echo esc_html( $label ); ?>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
</nav>

<?php do_action( 'woocommerce_after_account_navigation' ); ?>
