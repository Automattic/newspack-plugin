<?php
/**
 * Template.
 *
 * @package Newspack
 */

// phpcs:disable WordPressVIPMinimum.Security.Mustache.OutputNotation

if ( 'default' === get_theme_mod( 'theme_colors', 'default' ) ) {
	$primary_color = '#dd3333';
} else {
	$primary_color = get_theme_mod( 'primary_color_hex', '#dd3333' );
}

// Default post content.
$post_content  = '<!-- wp:site-logo {"align":"center"} /-->';
$post_content .= '<!-- wp:heading --><h2 class="wp-block-heading">' . __( 'Sign in', 'newspack' ) . '</h2><!-- /wp:heading -->';
$post_content .= '<!-- wp:paragraph --><p>' . __( 'Use the following code to login to your account:', 'newspack' ) . '</p><!-- /wp:paragraph -->';
$post_content .= '<!-- wp:paragraph {"align":"center","fontSize":"x-large"} --><p class="has-text-align-center has-x-large-font-size"><code>*MAGIC_LINK_OTP*</code></p><!-- /wp:paragraph -->';
$post_content .= '<!-- wp:paragraph --><p>' . __( 'You can also log into your account by clicking the following button:', 'newspack' ) . '</p><!-- /wp:paragraph -->';
$post_content .= '<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left","orientation":"horizontal","flexWrap":"nowrap"}} --><div class="wp-block-buttons">';
$post_content .= '<!-- wp:button {"textAlign":"center","style":{"color":{"background":"' . esc_attr( $primary_color ) . '"},"border":{"radius":"4px"}}} -->';
$post_content .= '<div class="wp-block-button"><a class="wp-block-button__link has-background has-text-align-center wp-element-button" href="*MAGIC_LINK_URL*" style="border-radius:4px;background-color:' . esc_attr( $primary_color ) . '">Continue to *SITE_TITLE*</a></div>';
$post_content .= '<!-- /wp:button -->';
$post_content .= '</div><!-- /wp:buttons -->';
$post_content .= '<!-- wp:paragraph --><p>' . __( 'Or copy and paste the link in your browser:', 'newspack' ) . ' <a href="*MAGIC_LINK_URL*" data-type="URL" data-id="*MAGIC_LINK_URL*">*MAGIC_LINK_URL*</a></p><!-- /wp:paragraph -->';
$post_content .= '<!-- wp:paragraph --><p>' . __( 'If you did not request this code, please ignore this email.', 'newspack' ) . '</p><!-- /wp:paragraph -->';
// Footer.
$post_content .= '<!-- wp:group {"backgroundColor":"' . esc_attr( $primary_color ) . '","layout":{"type":"constrained"}} --><div class="wp-block-group has-primary-background-color has-background">';
// TODO: Conditionally render social links if present.
$post_content .= '<!-- wp:social-links {"iconBackgroundColor":"' . esc_attr( $primary_color ) . '","iconBackgroundColorValue":"' . esc_attr( $primary_color ) . '","className":"is-style-default","layout":{"type":"flex","flexWrap":"nowrap"}} -->';
$post_content .= '<ul class="wp-block-social-links has-icon-background-color is-style-default">';
$post_content .= '<!-- wp:social-link {"service":"instagram"} /-->';
$post_content .= '<!-- wp:social-link {"service":"twitter"} /-->';
$post_content .= '<!-- wp:social-link {"service":"facebook"} /-->';
$post_content .= '<!-- wp:social-link {"service":"youtube"} /-->';
$post_content .= '</ul>';
$post_content .= '<!-- /wp:social-links -->';
// TODO: Fix translations.
$post_content .= '<!-- wp:paragraph {"fontSize":"small"} --><p class="has-small-font-size">*SITE_TITLE* - *SITE_ADDRESS*<br>' . __( 'You received this email because you requested to sign in to', 'newspack' ) . ' *SITE_URL*</p><!-- /wp:paragraph -->';
$post_content .= '</div><!-- /wp:group -->';

return array(
	'post_title'   => __( 'Sign in', 'newspack' ),
	'post_content' => $post_content,
	'email_html'   => '<div><p>Hello World!</p></div>',
);
