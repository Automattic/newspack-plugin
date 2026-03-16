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

// Extract the first subscription product ID from custom access rules, if available.
$product_id = 0;
if ( ! empty( $pattern_context['custom_access_settings']['access_rules'] ) ) {
	foreach ( $pattern_context['custom_access_settings']['access_rules'] as $group ) {
		foreach ( $group as $rule ) {
			if ( 'subscription' === ( $rule['slug'] ?? '' ) && ! empty( $rule['value'] ) ) {
				$product_id = absint( is_array( $rule['value'] ) ? reset( $rule['value'] ) : $rule['value'] );
				break 2;
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
			<!-- wp:group {"style":{"dimensions":{"minHeight":"100%"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch","verticalAlignment":"space-between"}} -->
			<div class="wp-block-group" style="min-height:100%">
				<!-- wp:paragraph {"align":"center"} -->
				<p class="has-text-align-center">
					<?php
					printf(
						wp_kses_post(
							/* translators: 1: number of free articles, 2: period label such as "month" or "week". */
							__( 'Get %1$s free articles every %2$s with a free account.', 'newspack' )
						),
						'<strong>' . esc_html( $metering_count ) . '</strong>',
						esc_html( $metering_period )
					);
					?>
				</p>
				<!-- /wp:paragraph -->

				<!-- wp:buttons -->
				<div class="wp-block-buttons">
					<!-- wp:button {"width":100,"className":"is-style-outline"} -->
					<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline">
						<a class="wp-block-button__link wp-element-button" href="#register_modal"><?php esc_html_e( 'Create a free account', 'newspack' ); ?></a>
					</div>
					<!-- /wp:button -->
				</div>
				<!-- /wp:buttons -->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:group {"style":{"dimensions":{"minHeight":"100%"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch","verticalAlignment":"space-between"}} -->
			<div class="wp-block-group" style="min-height:100%">
				<!-- wp:paragraph {"align":"center"} -->
				<p class="has-text-align-center">
					<?php esc_html_e( 'Support our journalism and get unlimited access to our full archive.', 'newspack' ); ?>
				</p>
				<!-- /wp:paragraph -->

				<!-- wp:newspack-blocks/checkout-button <?php echo wp_json_encode( $checkout_attrs ); ?> /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
	<div class="wp-block-buttons">
		<!-- wp:button {"backgroundColor":"base","textColor":"contrast","style":{"elements":{"link":{"color":{"text":"var:preset|color|contrast"}}}}} -->
		<div class="wp-block-button">
			<a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background has-link-color wp-element-button" href="#signin_modal">
				<?php esc_html_e( 'Sign in to an existing account', 'newspack' ); ?>
			</a>
		</div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
