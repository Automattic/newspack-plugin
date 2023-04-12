<?php
/**
 * Memberships Pay Wall Two Tiers Pattern.
 *
 * @package Newspack
 */

?>
<!-- wp:group -->
<div class="wp-block-group">
	<!-- wp:heading -->
	<h2 class="wp-block-heading"><?php _e( 'Become a member to continue reading', 'newspack' ); ?></h2>
	<!-- /wp:heading -->
	<!-- wp:columns {"verticalAlignment":"center"} -->
	<div class="wp-block-columns are-vertically-aligned-center">
		<!-- wp:column { "verticalAlignment":"center","style":{"typography":{"fontSize":"18px"}} } -->
		<div class="wp-block-column is-vertically-aligned-center" style="font-size:18px">
			<!-- wp:heading {"level":3} -->
			<h3 class="wp-block-heading">Regular access</h3>
			<!-- /wp:heading -->
			<!-- wp:paragraph { "style":{"typography":{"fontSize":"18px"}} } -->
			<p style="font-size:18px">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ornare,
				dolor et pellentesque tincidunt, neque mi maximus sem, quis vehicula nulla
				tellus nec purus.
			</p>
			<!-- /wp:paragraph -->
			<!-- wp:newspack-blocks/checkout-button {"text":"Get Regular Access"} /-->
		</div>
		<!-- /wp:column -->
		<!-- wp:column {"verticalAlignment":"center","width":"55%","style":{"typography":{"fontSize":"30px"},"spacing":{"padding":{"top":"2rem","right":"2rem","bottom":"2rem","left":"2rem"}} },"backgroundColor":"light-gray"} -->
		<div class="wp-block-column is-vertically-aligned-center has-light-gray-background-color has-background" style="padding-top:2rem;padding-right:2rem;padding-bottom:2rem;padding-left:2rem;font-size:30px;flex-basis:55%">
			<!-- wp:heading {"level":3} -->
			<h3 class="wp-block-heading">Premium Access</h3>
			<!-- /wp:heading -->
			<!-- wp:paragraph -->
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ornare,
				dolor et pellentesque tincidunt, neque mi maximus sem, quis vehicula nulla
				tellus nec purus.
			</p>
			<!-- /wp:paragraph -->
			<!-- wp:newspack-blocks/checkout-button {"text":"Get Premium Access","backgroundColor":"primary","align":"wide"} /-->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->
