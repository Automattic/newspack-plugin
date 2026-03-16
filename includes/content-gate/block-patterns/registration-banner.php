<?php
/**
 * Memberships Registration Banner Pattern.
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

?>
<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Registration', 'newspack' ); ?>"},"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50","right":"var:preset|spacing|50"},"blockGap":"var:preset|spacing|30"},"border":{"radius":"8px","width":"1px"}},"borderColor":"base-3","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide has-border-color has-base-3-border-color" style="border-width:1px;border-radius:8px;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50)">

	<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Content', 'newspack' ); ?>"},"style":{"spacing":{"blockGap":"var:preset|spacing|20"}},"layout":{"type":"constrained","justifyContent":"left"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph -->
		<p>
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

		<!-- wp:paragraph {"style":{"elements":{"link":{"color":{"text":"var:preset|color|contrast-3"}}}},"textColor":"contrast-3","fontSize":"x-small"} -->
		<p class="has-contrast-3-color has-text-color has-link-color has-x-small-font-size"><a href="#signin_modal"><?php esc_html_e( 'Sign in to an existing account', 'newspack' ); ?></a></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center","flexWrap":"nowrap"}} -->
	<div class="wp-block-buttons">
		<!-- wp:button -->
		<div class="wp-block-button">
			<a class="wp-block-button__link wp-element-button" href="#register_modal">
				<?php esc_html_e( 'Create a free account', 'newspack' ); ?>
			</a>
		</div>
		<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->

</div>
<!-- /wp:group -->
