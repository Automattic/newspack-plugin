<?php
/**
 * Template.
 *
 * @package Newspack
 */

namespace Newspack;

// phpcs:disable WordPressVIPMinimum.Security.Mustache.OutputNotation

[ 'primary_color' => $primary_color, 'secondary_color' => $secondary_color ]  = newspack_get_theme_colors();
[ 'block_markup' => $social_links, 'html_markup' => $social_links_html ]      = newspack_get_social_markup();

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

$email_html = '
	<html lang="und" dir="auto" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>Sign in</title><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style type="text/css">#outlook a { padding:0; }
		body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
		table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
		img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
		p { display:block;margin:13px 0; }</style><!--[if mso]>
		<noscript>
		<xml>
		<o:OfficeDocumentSettings>
		<o:AllowPNG/>
		<o:PixelsPerInch>96</o:PixelsPerInch>
		</o:OfficeDocumentSettings>
		</xml>
		</noscript>
		<![endif]--><!--[if lte mso 11]>
		<style type="text/css">
		.mj-outlook-group-fix { width:100% !important; }
		</style>
		<![endif]--><style type="text/css">@media only screen and (min-width:480px) {
			.mj-column-per-100 { width:100% !important; max-width: 100%; }
		}</style><style media="screen and (min-width:480px)">.moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }</style><style type="text/css">@media only screen and (max-width:479px) {
		table.mj-full-width-mobile { width: 100% !important; }
		td.mj-full-width-mobile { width: auto !important; }
		}</style><style type="text/css">/* Paragraph */
	p {
		margin-top: 0 !important;
		margin-bottom: 0 !important;
	}

	/* Link */
	a {
		color: inherit !important;
		text-decoration: underline;
	}
	a:active, a:focus, a:hover {
		text-decoration: none;
	}
	a:focus {
		outline: thin dotted #000;
	}

	/* Button */
	.is-style-outline a {
		background: #fff !important;
		border: 2px solid !important;
		display: block !important;
	}

	/* Heading */
	h1, h2, h3, h4, h5, h6 {
		margin-top: 0;
		margin-bottom: 0;
	}

	h1 {
		font-size: 2.44em;
		line-height: 1.24;
	}

	h2 {
		font-size: 1.95em;
		line-height: 1.36;
	}

	h3 {
		font-size: 1.56em;
		line-height: 1.44;
	}

	h4 {
		font-size: 1.25em;
		line-height: 1.6;
	}

	h5 {
		font-size: 1em;
		line-height: 1.5em;
	}

	h6 {
		font-size: 0.8em;
		line-height: 1.56;
	}

	/* List */
	ul, ol {
		margin: 12px 0;
		padding: 0;
		list-style-position: inside;
	}

	/* Quote */
	blockquote,
	.wp-block-quote {
		background: transparent;
		border-left: 0.25em solid;
		margin: 0;
		padding-left: 24px;
	}
	blockquote cite,
	.wp-block-quote cite {
		color: #767676;
	}
	blockquote p,
	.wp-block-quote p {
		padding-bottom: 12px;
	}
	.wp-block-quote.is-style-plain,
	.wp-block-quote.is-style-large {
		border-left: 0;
		padding-left: 0;
	}
	.wp-block-quote.is-style-large p {
		font-size: 24px;
		font-style: italic;
		line-height: 1.6;
	}

	/* Image */
	@media all and (max-width: 590px) {
		img {
			height: auto !important;
		}
	}

	/* Social links */
	.social-element img {
		border-radius: 0 !important;
	}

	/* Has Background */
	.mj-column-has-width .has-background,
	.mj-column-per-50 .has-background {
		padding: 12px;
	}

	/* Mailchimp Footer */
	#canspamBarWrapper {
		border: 0 !important;
	}

	.has-primary-color { color: ' . esc_attr( $primary_color ) . '; }
	.has-primary-variation-color { color: #0b3ed7; }
	.has-secondary-color { color: ' . esc_attr( $secondary_color ) . '; }
	.has-secondary-variation-color { color: #000a21; }
	.has-dark-gray-color { color: #111111; }
	.has-medium-gray-color { color: #767676; }
	.has-light-gray-color { color: #EEEEEE; }
	.has-white-color { color: #ffffff; }
	.has-black-color { color: #000000; }
	.has-cyan-bluish-gray-color { color: #abb8c3; }
	.has-pale-pink-color { color: #f78da7; }
	.has-vivid-red-color { color: #cf2e2e; }
	.has-luminous-vivid-orange-color { color: #ff6900; }
	.has-luminous-vivid-amber-color { color: #fcb900; }
	.has-light-green-cyan-color { color: #7bdcb5; }
	.has-vivid-green-cyan-color { color: #00d084; }
	.has-pale-cyan-blue-color { color: #8ed1fc; }
	.has-vivid-cyan-blue-color { color: #0693e3; }
	.has-vivid-purple-color { color: #9b51e0; }</style></head><body style="word-spacing:normal;background-color:#ffffff;"><div style="background-color:#ffffff;" lang="und" dir="auto"><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="' . esc_attr( $secondary_color ) . ' !important" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="background:' . esc_attr( $secondary_color ) . ' !important;background-color:' . esc_attr( $secondary_color ) . ' !important;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:' . esc_attr( $secondary_color ) . ' !important;background-color:' . esc_attr( $secondary_color ) . ' !important;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:56px 56px 56px 56px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:50px;"><a href="*SITE_URL*" target="_blank"><img alt="acof-flag" src="*SITE_LOGO*" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="50" height="auto"></a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Arial;font-size:16px;line-height:1.5;text-align:left;color:#000000;"><h2 class="wp-block-heading" style="font-style:normal;font-weight:400">' . __( 'Sign in', 'newspack' ) . '</h2></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Georgia;font-size:16px;line-height:1.5;text-align:left;color:#000000;"><p>' . __( 'Use the following code to login to your account:', 'newspack' ) . '</p></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Georgia;font-size:36px;line-height:1.5;text-align:left;color:#000000;"><p class="has-x-large-font-size"><code>895671</code></p></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Georgia;font-size:16px;line-height:1.5;text-align:left;color:#000000;"><p style="font-style:normal;font-weight:400">' . __( 'You can also log into your account by clicking the following button:', 'newspack' ) . '</p></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="mj-column-has-width-outlook" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix mj-column-has-width" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tbody><tr><td align="center" bgcolor="' . esc_attr( $primary_color ) . ' !important" role="presentation" style="border:none;border-radius:4px;cursor:auto;mso-padding-alt:12px 24px;background:' . esc_attr( $primary_color ) . ' !important;" valign="middle"><a href="*MAGIC_LINK_URL*" style="display:inline-block;background:' . esc_attr( $primary_color ) . ' !important;color:#fff !important;font-family:Georgia;font-size:16px;font-weight:bold;line-height:1.5;margin:0;text-decoration:none;text-transform:none;padding:12px 24px;mso-padding-alt:0px;border-radius:4px;" target="_blank">' . sprintf( /* Translators: s: site title. */ __( 'Continue to %s', 'newspack' ), '*SITE_TITLE*' ) . '</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Georgia;font-size:16px;line-height:1.5;text-align:left;color:#000000;"><p>' . __( 'Or copy and paste the link in your browser:', 'newspack' ) . ' <a href="*MAGIC_LINK_URL*" data-type="URL" data-id="*MAGIC_LINK_URL*" target="_blank">*MAGIC_LINK_URL*</a></p></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Georgia;font-size:16px;line-height:1.5;text-align:left;color:#000000;"><p>' . __( 'If you did not request this code, please ignore this email.', 'newspack' ) . '</p></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" bgcolor="' . esc_attr( $primary_color ) . ' !important" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="background:' . esc_attr( $primary_color ) . ' !important;background-color:' . esc_attr( $primary_color ) . ' !important;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:' . esc_attr( $primary_color ) . ' !important;background-color:' . esc_attr( $primary_color ) . ' !important;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:56px 56px 56px 56px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><!--[if mso | IE]><table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]--><table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation" style="float:none;display:inline-table;"><tbody><tr class="social-element">' . $social_links_html . '</tr></tbody></table><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:488px;" width="488" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:488px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:488px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="left" style="font-size:0px;padding:0;word-break:break-word;"><div style="font-family:Georgia;font-size:12px;line-height:1.5;text-align:left;color:#000000;"><p class="has-small-font-size">' . sprintf( /* Translators: 1: site title 2: site base address. */ __( '%1$s - %2$s', 'newspack' ), '<strong>*SITE_TITLE*</strong>', '*SITE_ADDRESS*' ) . '<br> ' . sprintf( /* Translators: s: link to site url. */ __( 'You received this email because you requested to sign in to %s', 'newspack' ), '<a href="*SITE_URL*" target="_blank">*SITE_URL*</a>' ) . '</p></div></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></div></body></html>';

return array(
	'post_title'   => __( 'Sign in', 'newspack' ),
	'post_content' => $post_content,
	'email_html'   => $email_html,
);
