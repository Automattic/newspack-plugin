<?php
/**
 * Memberships Paywall with Three Tiers Pattern.
 *
 * @package Newspack
 */

$member_features = [
	__( 'Unlimited access to our content', 'newspack' ),
	__( 'Puzzles and recipes', 'newspack' ),
	__( 'Support quality journalism', 'newspack' ),
];

$patron_features = [
	__( 'Everything Members get', 'newspack' ),
	__( 'Exclusive podcasts and newsletters', 'newspack' ),
	__( 'Our appreciation and love', 'newspack' ),
];

$vip_features = [
	__( 'Everything Patrons get', 'newspack' ),
	__( 'Special offers from our partners', 'newspack' ),
	__( 'Priority invitations to events', 'newspack' ),
];

?>
<!-- wp:separator {"className":"is-style-dots"} -->
<hr class="wp-block-separator has-alpha-channel-opacity is-style-dots"/>
<!-- /wp:separator -->

<!-- wp:group {"metadata":{"name":"<?php esc_html_e( 'Wall', 'newspack' ); ?>"},"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|80","right":"var:preset|spacing|80"}},"border":{"radius":"6px","width":"1px"}},"borderColor":"base-3","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide has-border-color has-base-3-border-color" style="border-width:1px;border-radius:6px;padding-top:var(--wp--preset--spacing--80);padding-right:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80);padding-left:var(--wp--preset--spacing--80)">

	<!-- wp:heading {"textAlign":"center","level":3} -->
	<h3 class="wp-block-heading has-text-align-center">
		<?php esc_html_e( 'Choose an option to continue reading', 'newspack' ); ?>
	</h3>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center"} -->
	<p class="has-text-align-center">
		<?php esc_html_e( 'Subscribe to the Member, Patron or VIP monthly memberships to gain unlimited access to exclusive content.', 'newspack' ); ?>
	</p>
	<!-- /wp:paragraph -->

	<!-- wp:group {"align":"wide","layout":{"type":"constrained","wideSize":"964px"}} -->
	<div class="wp-block-group alignwide">
	</div>
	<!-- /wp:group -->

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
