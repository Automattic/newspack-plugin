<?php
/**
 * Custom header component for My Account single subscription pages.
 * Note that this template is not a standard WooCommerce Subscriptions template.
 *
 * @author   Newspack
 * @category WooCommerce Subscriptions/Templates
 * @package  Newspack
 */

namespace Newspack;

use Newspack\WooCommerce_Subscriptions;
use Newspack\Newspack_UI_Icons;

defined( 'ABSPATH' ) || exit;

$actions      = $args['actions'];
$subscription = $args['subscription'];

// Ensure the cancel action is shown last.
if ( ! empty( $actions['cancel'] ) ) {
	$cancel_action         = $actions['cancel'];
	$cancel_action['name'] = __( 'Cancel subscription', 'newspack-plugin' );
	unset( $actions['cancel'] );
	$actions['cancel'] = $cancel_action;
}

// Rename 'Change payment' action.
if ( ! empty( $actions['change_payment_method']['name'] ) ) {
	$actions['change_payment_method']['name'] = __( 'Update payment method', 'newspack-plugin' );
}

\do_action( 'newspack_woocommerce_before_subscription_header', $subscription, $actions );
?>
<header class="newspack-my-account__subscription--header">
	<?php
	$product_id = WooCommerce_Subscriptions::get_subscription_product_id( $subscription );
	if ( $product_id ) {
		$product   = \wc_get_product( $product_id );
		$is_single = 1 === count( \wcs_get_users_subscriptions() ) && \apply_filters( 'wcs_my_account_redirect_to_single_subscription', true );
		if ( $product ) :
			?>
		<h2 class="newspack-ui__font--m">
			<?php if ( ! $is_single ) : ?>
				<a href="<?php echo esc_url( \wc_get_account_endpoint_url( 'subscriptions' ) ); ?>" class="newspack-my-account__subscription--back-link newspack-ui__button newspack-ui__button--ghost" title="<?php esc_attr_e( 'All subscriptions', 'newspack-plugin' ); ?>">
				<?php Newspack_UI_Icons::print_svg( 'chevronLeft' ); ?>
			<?php endif; ?>
			<?php echo \esc_html( $product->get_name() ); ?>
			<?php if ( ! $is_single ) : ?>
				</a>
			<?php endif; ?>
		</h2>
			<?php
		endif;
	}
	if ( ! empty( $actions ) ) :
		?>
	<div class="newspack-my-account__subscription--actions">
		<?php
		$items = $subscription->get_items();
		if ( 1 < count( $items ) ) {
			\add_filter(
				'woocommerce_subscriptions_switch_link_classes',
				function() {
					return [
						'wcs-switch-link',
						'newspack-ui__button',
						'newspack-ui__button--ghost',
						'newspack-ui__button--small',
					];
				}
			);
			\add_filter(
				'woocommerce_subscriptions_switch_link_text',
				function( $text, $item_id, $item ) {
					return sprintf(
						// translators: %1$s is the action (Edit for donations, Change for non-donation subscriptions), %2$s is the name of the item.
						'%1$s: %2$s',
						Donations::is_donation_product( $item->get_product_id() ) ? __( 'Edit', 'newspack-plugin' ) : __( 'Change', 'newspack-plugin' ),
						$item->get_name()
					);
				},
				13,
				3
			);
			?>
			<div class="newspack-ui__dropdown newspack-my-account__subscription--change-subscription-dropdown">
				<button class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--small newspack-ui__dropdown__toggle">
					<span><?php _e( 'Change subscription', 'newspack-plugin' ); ?></span>
					<?php Newspack_UI_Icons::print_svg( 'more' ); ?>
				</button>
				<div class="newspack-ui__dropdown__content">
					<ul>
						<?php foreach ( $items as $item ) : ?>
							<li class="newspack-my-account__subscription--change-subscription-item"><?php \WC_Subscriptions_Switcher::print_switch_link( $item->get_id(), $item, $subscription ); ?></li>
						<?php endforeach; ?>
					</ul>
				</div>
			</div>
			<?php
		} elseif ( 1 === count( $items ) ) {
			$item = reset( $items );
			\add_filter(
				'woocommerce_subscriptions_switch_link_classes',
				function( $classes ) {
					return [
						'wcs-switch-link',
						'newspack-ui__button',
						'newspack-ui__button--secondary',
						'newspack-ui__button--small',
						'newspack-my-account__subscription--change-subscription-item',
					];
				}
			);
			?>
			<?php \WC_Subscriptions_Switcher::print_switch_link( $item->get_id(), $item, $subscription ); ?>
			<?php
		}
		?>
		<div class="newspack-ui__dropdown newspack-my-account__subscription--actions-dropdown">
			<button class="newspack-ui__button newspack-ui__button--secondary newspack-ui__button--small newspack-ui__dropdown__toggle">
				<span><?php _e( 'More', 'newspack-plugin' ); ?></span>
				<?php Newspack_UI_Icons::print_svg( 'more' ); ?>
			</button>
			<div class="newspack-ui__dropdown__content">
				<ul>
					<?php
					\add_filter(
						'woocommerce_subscriptions_switch_link_classes',
						function( $classes ) {
							return [
								'wcs-switch-link',
								'newspack-ui__button',
								'newspack-ui__button--ghost',
								'newspack-ui__button--small',
							];
						}
					);
					?>
					<?php foreach ( $items as $item ) : ?>
						<li class="newspack-my-account__subscription--change-subscription-item"><?php \WC_Subscriptions_Switcher::print_switch_link( $item->get_id(), $item, $subscription ); ?></li>
					<?php endforeach; ?>
					<?php foreach ( $actions as $key => $action_link ) : ?>
						<?php
						$classes = [
							'newspack-ui__button',
							'newspack-ui__button--ghost',
							\sanitize_html_class( $key ),
						];
						if ( 'cancel' === $key ) {
							$classes[] = 'newspack-ui__button--destructive';
						}
						?>
						<li><a class="<?php echo \esc_attr( implode( ' ', $classes ) ); ?>" href="<?php echo \esc_url( $action_link['url'] ); ?>"><?php echo \esc_html( $action_link['name'] ); ?></a></li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
		<?php \do_action( 'newspack_woocommerce_after_subscription_actions', $subscription, $actions ); ?>
	</div>
	<?php endif; ?>
</header>
<?php
\do_action( 'newspack_woocommerce_after_subscription_header', $subscription, $actions );
