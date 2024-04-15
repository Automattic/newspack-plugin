<?php
/**
 * Cancellation Template.
 *
 * @package Newspack
 */

$post_content = '
	<!-- wp:heading -->
	<h2>*CANCELLATION_TITLE*</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph -->
	<p>' . sprintf( /* Translators: 1: the cancellation type (subscription or recurring donation). 2: the site title. */ __( 'This is to confirm the cancellation of your %1$s to %2$s. We\'re sorry to see you go! If you\'d like to restart your %1$s, you can do so by clicking the button below.', 'newspack-plugin' ), '*CANCELLATION_TYPE*', '*SITE_TITLE*' ) . '</p>
	<!-- /wp:paragraph -->

	<!-- wp:buttons -->
	<div class="wp-block-buttons">
	<!-- wp:button {"style":{"color":{"background":"#dd3333"}}} -->
	<div class="wp-block-button">
	<a class="wp-block-button__link has-background" href="*SUBSCRIPTION_URL*" style="background-color:#dd3333">*BUTTON_TEXT*</a>
	</div>
	<!-- /wp:button -->
	</div>
	<!-- /wp:buttons -->

	<!-- wp:paragraph -->
	<p>' . sprintf( /* Translators: s: site admin email address. */ __( 'If you have any questions, you can reach us at %s. We appreciate your support', 'newspack-plugin' ), '*CONTACT_EMAIL*' ) . '</p>
	<!-- /wp:paragraph -->';

$email_html = '
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
	<head>
		<title>*CANCELLATION_TITLE*</title>
		<!--[if !mso]><!-->
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<!--<![endif]-->
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<style type="text/css">
		  #outlook a { padding:0; }
		  body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
		  table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
		  img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
		  p { display:block;margin:13px 0; }
		</style>
		<!--[if mso]>
		<xml>
		<o:OfficeDocumentSettings>
		  <o:AllowPNG/>
		  <o:PixelsPerInch>96</o:PixelsPerInch>
		</o:OfficeDocumentSettings>
		</xml>
		<![endif]-->
		<!--[if lte mso 11]>
		<style type="text/css">
		  .mj-outlook-group-fix { width:100% !important; }
		</style>
		<![endif]-->
		<style type="text/css">
			@media only screen and (min-width:480px) {
				.mj-column-per-100 { width:100% !important; max-width: 100%; }
				.mj-column-per-33-333333333333 { width:33.333333333333% !important; max-width: 33.333333333333%; }
			}
		</style>
		<style media="screen and (min-width:480px)">
			.moz-text-html .mj-column-per-100 { width:100% !important; max-width: 100%; }
			.moz-text-html .mj-column-per-33-333333333333 { width:33.333333333333% !important; max-width: 33.333333333333%; }
		</style>
		<style type="text/css">
			/* Paragraph */
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
			h1 { font-size: 2.44em; line-height: 1.4; }
			h2 { font-size: 1.95em; line-height: 1.4; }
			h3 { font-size: 1.56em; line-height: 1.4; }
			h4 { font-size: 1.25em; line-height: 1.5; }
			h5 { font-size: 1em; line-height: 1.8; }
			h6 { font-size: 0.8em; line-height: 1.8; }
			h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0; }

			/* List */
			ul, ol {
				margin-bottom: 0;
				margin-top: 0;
				padding-left: 1.3em;
			}

			/* Quote */
			blockquote,
			.wp-block-quote {
				border-left: 4px solid #000;
				margin: 0;
				padding-left: 20px;
			}
			blockquote cite,
			.wp-block-quote cite {
				color: #767676;
			}
			blockquote p,
			.wp-block-quote p {
				padding-bottom: 12px;
			}
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
		</style>
	</head>
	<body style="word-spacing:normal;background-color:#ffffff;">
		<div style="background-color:#ffffff;">
	  <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
		<div  style="margin:0px auto;max-width:600px;">
		<table
		   align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"
		>
		  <tbody>
			<tr>
			  <td
				 style="direction:ltr;font-size:0px;padding:0;text-align:center;"
			  >
				<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->
		<div
		 class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"
		>
		<table
		 border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"
		>
		<tbody>
		  <tr>
			<td  style="vertical-align:top;padding:12px;">
		<table
		 border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%"
	>
		<tbody>

			  <tr>
				<td
				   align="left" style="font-size:0px;padding:0;word-break:break-word;"
				>

	  <div
		 style="font-family:Arial;font-size:16px;line-height:1.8;text-align:left;color:#000000;"
	  ><h2>*CANCELLATION_TITLE*</h2></div>

				</td>
			  </tr>

		</tbody>
	  </table>

			</td>
		  </tr>
		</tbody>
	  </table>

	  </div>

		  <!--[if mso | IE]></td></tr></table><![endif]-->
			  </td>
			</tr>
		  </tbody>
		</table>

	  </div>


	  <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->


	  <div style="margin:0px auto;max-width:600px;">

		<table
		   align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"
		>
		  <tbody>
			<tr>
			  <td
				 style="direction:ltr;font-size:0px;padding:0;text-align:center;"
			  >
				<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->

	  <div
		 class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"
	  >

	  <table
		 border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"
	  >
		<tbody>
		  <tr>
			<td  style="vertical-align:top;padding:12px;">

	  <table
		 border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%"
	  >
		<tbody>

			  <tr>
				<td
				   align="left" style="font-size:0px;padding:0;word-break:break-word;"
				>

	  <div
		 style="font-family:Georgia;font-size:16px;line-height:1.8;text-align:left;color:#000000;"
	  ><p>' . sprintf( /* Translators: 1: the cancellation type (subscription or recurring donation). 2: the site title. */ __( 'This is to confirm the cancellation of your %1$s to %2$s. We\'re sorry to see you go! If you\'d like to restart your %1$s, you can do so by clicking the button below.', 'newspack-plugin' ), '*CANCELLATION_TYPE*', '*SITE_TITLE*' ) . '</p></div>

				</td>
			  </tr>

		</tbody>
	  </table>

			</td>
		  </tr>
		</tbody>
	  </table>

	  </div>

		  <!--[if mso | IE]></td></tr></table><![endif]-->
			  </td>
			</tr>
		  </tbody>
		</table>

	  </div>

		<!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
		<div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="mj-column-has-width-outlook" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix mj-column-has-width" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:12px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tbody><tr><td align="center" bgcolor="#dd3333 !important" role="presentation" style="border:none;border-radius:999px;cursor:auto;mso-padding-alt:12px 24px;background:#dd3333 !important;" valign="middle"><a href="*SUBSCRIPTION_URL*" style="display:inline-block;background:#dd3333 !important;color:#fff !important;font-family:Georgia;font-size:16px;font-weight:bold;line-height:1.5;margin:0;text-decoration:none;text-transform:none;padding:12px 24px;mso-padding-alt:0px;border-radius:999px;" target="_blank">*BUTTON_TEXT*</a></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div>
		<!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
	  <div  style="margin:0px auto;max-width:600px;">

		<table
		   align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"
		>
		  <tbody>
			<tr>
			  <td
				 style="direction:ltr;font-size:0px;padding:0;text-align:center;"
			  >
				<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]-->

	  <div
		 class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"
	  >

	  <table
		 border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"
	  >
		<tbody>
		  <tr>
			<td  style="vertical-align:top;padding:12px;">

	  <table
		 border="0" cellpadding="0" cellspacing="0" role="presentation" style="" width="100%"
	  >
		<tbody>

			  <tr>
				<td
				   align="left" style="font-size:0px;padding:0;word-break:break-word;"
				>

	  <div
		 style="font-family:Georgia;font-size:16px;line-height:1.8;text-align:left;color:#000000;"
	  ><p>' . sprintf( /* Translators: s: site admin email address. */ __( 'If you have any questions, you can reach us at %s. We appreciate your support!', 'newspack-plugin' ), '*CONTACT_EMAIL*' ) . '</p></div>

				</td>
			  </tr>

		</tbody>
	  </table>

			</td>
		  </tr>
		</tbody>
	  </table>

	  </div>

		  <!--[if mso | IE]></td></tr></table><![endif]-->
			  </td>
			</tr>
		  </tbody>
		</table>

	  </div>
		<!--[if mso | IE]></td></tr></table><![endif]-->
		</div>
	</body>
</html>';

return array(
	'post_title'   => __( 'Subscription Cancelled', 'newspack' ),
	'post_content' => $post_content,
	'email_html'   => $email_html,
);
