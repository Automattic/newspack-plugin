<?php
/**
 * Memberships Paywall with One Tier Pattern.
 *
 * @package Newspack
 */

?>
<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Subscription', 'newspack-plugin' ); ?>"},"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|80","right":"var:preset|spacing|80"}},"border":{"radius":{"topLeft":"8px","topRight":"8px","bottomLeft":"8px","bottomRight":"8px"},"width":"1px"}},"borderColor":"base-3","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide has-border-color has-base-3-border-color" style="border-width:1px;border-top-left-radius:8px;border-top-right-radius:8px;border-bottom-left-radius:8px;border-bottom-right-radius:8px;padding-top:var(--wp--preset--spacing--80);padding-right:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80);padding-left:var(--wp--preset--spacing--80)">
	<!-- wp:heading {"textAlign":"center","level":3,"metadata":{"name":"<?php esc_html_e( 'Title', 'newspack-plugin' ); ?>"}} -->
	<h3 class="wp-block-heading has-text-align-center">
		<?php esc_html_e( 'This article is for paid members only', 'newspack' ); ?>
	</h3>
	<!-- /wp:heading -->

	<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Content', 'newspack-plugin' ); ?>"},"layout":{"type":"constrained","contentSize":"410px"}} -->
	<div class="wp-block-group">
		<!-- wp:paragraph {"align":"center"} -->
		<p class="has-text-align-center">
			<?php esc_html_e( 'Support our journalism and get unlimited access to this article and our full archive.', 'newspack' ); ?>
		</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->

	<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Buttons', 'newspack-plugin' ); ?>"},"style":{"spacing":{"blockGap":"12px"}},"layout":{"type":"constrained","contentSize":"410px"}} -->
	<div class="wp-block-group">
		<!-- wp:newspack-blocks/checkout-button {"text":"<?php esc_html_e( 'Subscribe', 'newspack' ); ?>","width":100,"align":"center"} /-->

		<!-- wp:buttons -->
		<div class="wp-block-buttons">
			<!-- wp:button {"backgroundColor":"base","textColor":"contrast","width":100,"style":{"elements":{"link":{"color":{"text":"var:preset|color|contrast"}}}}} -->
			<div class="wp-block-button has-custom-width wp-block-button__width-100">
				<a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background has-link-color wp-element-button" href="#signin_modal">
					<?php esc_html_e( 'Sign in to an existing account', 'newspack' ); ?>
				</a>
			</div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
