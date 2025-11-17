<?php
/**
 * Contribution Meter Pattern 3: Simple vertical layout.
 *
 * @package Newspack
 */

$image_url = \Newspack\Newspack::plugin_url() . '/includes/images/contribution-meter/contribution-3.jpg';
?>
<!-- wp:group {"metadata":{"name":"Contribution Pattern 3"},"className":"newspack-pattern contribution__style-3","layout":{"type":"constrained"}} -->
<div class="wp-block-group newspack-pattern contribution__style-3">
	<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
	<figure class="wp-block-image size-large">
		<img src="<?php echo esc_url( $image_url ); ?>" alt=""/>
	</figure>
	<!-- /wp:image -->

	<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|30"}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">
		<!-- wp:heading {"level":4} -->
		<h4 class="wp-block-heading"><?php esc_html_e( 'Support our publication', 'newspack-plugin' ); ?></h4>
		<!-- /wp:heading -->

		<!-- wp:group {"style":{"border":{"radius":"8px"},"elements":{"link":{"color":{"text":"var:preset|color|accent"}}}},"textColor":"accent","layout":{"type":"constrained"}} -->
		<div class="wp-block-group has-accent-color has-text-color has-link-color" style="border-radius:8px">
			<!-- wp:newspack/contribution-meter {"thickness":"l"} /-->
		</div>
		<!-- /wp:group -->

		<!-- wp:paragraph -->
		<p><?php esc_html_e( 'With the support of readers like you, we provide thoughtfully researched articles for a more informed and connected community. This is your chance to support credible, community-based, public-service journalism. Please join us!', 'newspack-plugin' ); ?></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:newspack-blocks/donate {"className":"is-style-modern"} /-->
</div>
<!-- /wp:group -->
