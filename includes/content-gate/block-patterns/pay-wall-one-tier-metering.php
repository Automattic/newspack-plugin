<?php
/**
 * Memberships Paywall with One Tier and Metering Pattern.
 *
 * @package Newspack
 */

// Extract metering settings from custom access context, with defaults.
// Custom access metering applies to registered readers without an active subscription.
$metering_count  = 4;
$metering_period = __( 'month', 'newspack' );
if ( ! empty( $pattern_context['custom_access_settings']['metering'] ) ) {
	$metering = $pattern_context['custom_access_settings']['metering'];
	if ( ! empty( $metering['count'] ) ) {
		$metering_count = absint( $metering['count'] );
	}
	if ( ! empty( $metering['period'] ) ) {
		$metering_period = esc_html( $metering['period'] );
	}
}

// Get the first purchasable subscription product from custom access rules, if available.
$product_id = 0;
if ( ! empty( $pattern_context['custom_access_settings']['access_rules'] ) && function_exists( 'wc_get_product' ) ) {
	foreach ( $pattern_context['custom_access_settings']['access_rules'] as $group ) {
		foreach ( $group as $rule ) {
			if ( 'subscription' === ( $rule['slug'] ?? '' ) && ! empty( $rule['value'] ) ) {
				$product = \wc_get_product( absint( is_array( $rule['value'] ) ? reset( $rule['value'] ) : $rule['value'] ) );
				if ( $product && $product->is_purchasable() ) {
					$product_id = $product->get_id();
					break 2;
				}
			}
		}
	}
}

$checkout_attrs = [
	'text'  => esc_html__( 'Become a member', 'newspack' ),
	'width' => 100,
	'align' => 'center',
];
if ( $product_id ) {
	$checkout_attrs['product'] = (string) $product_id;
}

?>
<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Subscription', 'newspack-plugin' ); ?>"},"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|80","right":"var:preset|spacing|80"}},"border":{"radius":{"topLeft":"8px","topRight":"8px","bottomLeft":"8px","bottomRight":"8px"},"width":"1px"}},"borderColor":"base-3","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide has-border-color has-base-3-border-color" style="border-width:1px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom-left-radius:8px;border-bottom-right-radius:8px;padding-top:var(--wp--preset--spacing--80);padding-right:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80);padding-left:var(--wp--preset--spacing--80)">
	<!-- wp:heading {"textAlign":"center","level":3,"metadata":{"name":"<?php esc_html_e( 'Title', 'newspack-plugin' ); ?>"}} -->
	<h3 class="wp-block-heading has-text-align-center">
		<?php esc_html_e( 'Unlock the full article', 'newspack' ); ?>
	</h3>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center"} -->
	<p class="has-text-align-center">
		<?php esc_html_e( 'Join a community of passionate readers and never miss a story.', 'newspack' ); ?>
	</p>
	<!-- /wp:paragraph -->

	<!-- wp:columns {"metadata":{"name":"<?php esc_html_e( 'Content', 'newspack-plugin' ); ?>"},"className":"is-style-borders","style":{"spacing":{"margin":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80"}}}} -->
	<div class="wp-block-columns is-style-borders" style="margin-top:var(--wp--preset--spacing--80);margin-bottom:var(--wp--preset--spacing--80)">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:paragraph {"align":"center"} -->
			<p class="has-text-align-center">
				<?php
				printf(
					wp_kses_post(
						/* translators: 1: number of free articles, 2: period label such as "month" or "week". */
						_n(
							'Get %1$s free article every %2$s with a free account.',
							'Get %1$s free articles every %2$s with a free account.',
							$metering_count,
							'newspack'
						)
					),
					'<strong>' . esc_html( $metering_count ) . '</strong>',
					esc_html( $metering_period )
				);
				?>
			</p>
			<!-- /wp:paragraph -->

			<!-- wp:newspack/reader-registration {"newsletterSubscription":false,"hideOauth":true,"className":"is-style-inline"} -->
			<div class="wp-block-newspack-reader-registration is-style-inline"></div>
			<!-- /wp:newspack/reader-registration -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:paragraph {"align":"center"} -->
			<p class="has-text-align-center">
				<?php esc_html_e( 'Support our journalism and get unlimited access to our full archive.', 'newspack' ); ?>
			</p>
			<!-- /wp:paragraph -->

			<!-- wp:newspack-blocks/checkout-button <?php echo wp_json_encode( $checkout_attrs ); ?> /-->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

</div>
<!-- /wp:group -->
