<?php
/**
 * Class for Newspack UI styles.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Class for reCAPTCHA integration.
 */
class Newspack_UI {
	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_styles' ] );
		\add_filter( 'the_content', [ __CLASS__, 'load_demo' ] );
	}

	/**
	 * Enqueue script and styles for Handoff Banner.
	 */
	public static function enqueue_styles() {
		\wp_enqueue_style(
			'newspack-ui',
			Newspack::plugin_url() . '/dist/newspack-ui.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Make a page to demo these components
	 */
	public static function return_demo_content() {
		ob_start();
		?>
		<div class="newspack-ui">
			<h2>Temporary Razzak Component Demo</h2>

			<p>Regular text (16px)</p>

			<p class="newspack-ui__font__small">Small text (14px).</p>

			<hr>

			<h2>Boxes</h2>

			<div class="newspack-ui__box">
				<p>Default box style</p>
			</div>

			<div class="newspack-ui__box newspack-ui__box__border">
				<p>Border box style</p>
			</div>

			<div class="newspack-ui__box newspack-ui__box__success">
				<p>"Success" box style</p>
			</div>

			<div class="newspack-ui__box newspack-ui__box__success newspack-ui__box__text-center">
				<?php
				/*
				 * TODO:
				 * Can this be nicely consolidated with the logic/code here instead of being stand alone? (https://github.com/Automattic/newspack-plugin/blob/686af034ec7fad95109b5d6341fb0115f031dfa6/includes/reader-activation/class-reader-activation.php#L934-L950)
				 */
				?>
				<span class="newspack-ui__icon newspack-ui__icon__success">
					<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
					</svg>
				</span>

				<p>
					<strong>Success box style, plus icon + <code>newspack-ui__box__text-center</code> class.</strong>
				</p>

				<p class="newspack-ui__font__small">Plus a little bit of text below it.</p>
			</div>

			<hr>

			<h2>Form elements</h2>
			<form>
				<p>
					<label for="text-input-demo">Text input</label>
					<input type="text" placeholder="Regular text">
				</p>

				<p>
					<label for="email-input-demo">Email input</label>
					<input type="email" placeholder="Email Address">
				</p>
			</form>

			<p>
				<label class="newspack-ui__input-checkradio">
					<input type="radio" name="radio-control-demo">
					This is a radio input.
				</label>
			</p>

			<p>
				<label class="newspack-ui__input-checkradio">
					<input type="radio" name="radio-control-demo">
					This is a radio input.
				</label>
			</p>

			<p>
				<label class="newspack-ui__input-checkradio">
					<input type="checkbox">
					This is a checkbox input.
				</label>
			</p>


			<hr>

			<h2>Checkbox/Radio Lists</h2>
			<label class="newspack-ui__input-checkradio newspack-ui__input-list">
				<input type="checkbox" name="checkbox-option-1">
				<span>
					<strong>The Weekly</strong><br>
					Friday roundup of the most relevant stories.
				</span>
			</label>

			<label class="newspack-ui__input-checkradio newspack-ui__input-list">
				<input type="checkbox" name="checkbox-option-2">
				<span>
					<strong>The Weekly</strong><br>
					Friday roundup of the most relevant stories.
				</span>
			</label>
			<br>
			<label class="newspack-ui__input-checkradio newspack-ui__input-list">
				<input type="radio" name="list-radio-option">
				<span>
					<strong>The Weekly</strong><br>
					Friday roundup of the most relevant stories.
				</span>
			</label>

			<label class="newspack-ui__input-checkradio newspack-ui__input-list">
				<input type="radio" name="list-radio-option">
				<span>
					<strong>The Weekly</strong><br>
					Friday roundup of the most relevant stories.
				</span>
			</label>

			<hr>

			<h2>Order table</h2>
			<h3 id="order_review_heading">Transaction details</h3>
			<div id="order_review" class="woocommerce-checkout-review-order newspack-ui__box">
				<table class="shop_table woocommerce-checkout-review-order-table" style="position: static; zoom: 1;">
					<thead>
						<tr>
							<th class="product-name">Product</th>
							<th class="product-total">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						<tr class="cart_item">
							<td class="product-name">
								Donate: Yearly&nbsp; <strong class="product-quantity">×&nbsp;1</strong>
							</td>
							<td class="product-total">
								<span class="subscription-price"><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">$</span>180.00</bdi></span> <span class="subscription-details"> / year</span></span>
							</td>
						</tr>
					</tbody>
					<tfoot>
						<tr class="cart-subtotal">
							<th>Subtotal</th>
							<td><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">$</span>180.00</bdi></span></td>
						</tr>

						<tr class="tax-rate tax-rate-ca-bc-gst-5-1">
							<th>GST 5%)</th>
							<td><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">$</span>9.00</span></td>
						</tr>
										<tr class="tax-rate tax-rate-ca-bc-pst-7-2">
							<th>PST (7%)</th>
							<td><span class="woocommerce-Price-amount amount"><span class="woocommerce-Price-currencySymbol">$</span>12.60</span></td>
						</tr>
						<tr class="order-total">
							<th>Total</th>
							<td><strong><span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">$</span>201.60</bdi></span></strong> </td>
						</tr>
					</tfoot>
				</table>
			</div>

			<hr>

			<h2>Buttons</h2>
			<p><code>newspack-ui__button__primary</code>, <code>__secondary</code>, and <code>__tertiary</code> classes for colours/borders, and <code>newspack-ui__button__wide</code>for being 100% wide</p>
			<button>Default Theme Button</button><br>
			<button class="newspack-ui__button__primary">Primary Button</button><br>
			<button class="newspack-ui__button__secondary">Secondary Button</button><br>
			<button class="newspack-ui__button__tertiary">Tertiary Button</button><br>
			<button class="newspack-ui__button__tertiary" disabled>Disabled</button><br>
			<button class="newspack-ui__button__secondary">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M19.6 10.227C19.6 9.51801 19.536 8.83701 19.418 8.18201H10V12.05H15.382C15.2706 12.6619 15.0363 13.2448 14.6932 13.7635C14.3501 14.2822 13.9054 14.726 13.386 15.068V17.578H16.618C18.509 15.836 19.6 13.273 19.6 10.228V10.227Z" fill="#4285F4"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99996 20C12.7 20 14.964 19.105 16.618 17.577L13.386 15.068C12.491 15.668 11.346 16.023 9.99996 16.023C7.39496 16.023 5.18996 14.263 4.40496 11.9H1.06396V14.49C1.89597 16.1468 3.17234 17.5395 4.7504 18.5126C6.32846 19.4856 8.14603 20.0006 9.99996 20Z" fill="#34A853"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M4.405 11.9C4.205 11.3 4.091 10.66 4.091 10C4.091 9.34001 4.205 8.70001 4.405 8.10001V5.51001H1.064C0.364015 6.90321 -0.000359433 8.44084 2.66054e-07 10C2.66054e-07 11.614 0.386 13.14 1.064 14.49L4.404 11.9H4.405Z" fill="#FBBC05"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99996 3.977C11.468 3.977 12.786 4.482 13.823 5.473L16.691 2.605C14.959 0.99 12.695 0 9.99996 0C6.08996 0 2.70996 2.24 1.06396 5.51L4.40396 8.1C5.19196 5.736 7.39596 3.977 9.99996 3.977Z" fill="#EA4335"></path>
				</svg>
				<span>
					Sign in with Google
				</span>
			</button>
			<button class="newspack-ui__button__wide">Default Theme Button</button>
			<button class="newspack-ui__button__primary newspack-ui__button__wide">Primary Button</button>
			<button class="newspack-ui__button__secondary newspack-ui__button__wide">Secondary Button</button>
			<button class="newspack-ui__button__tertiary newspack-ui__button__wide">Tertiary Button</button>
			<button class="newspack-ui__button__tertiary newspack-ui__button__wide" disabled>Disabled</button>
			<button class="newspack-ui__button__secondary newspack-ui__button__wide">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M19.6 10.227C19.6 9.51801 19.536 8.83701 19.418 8.18201H10V12.05H15.382C15.2706 12.6619 15.0363 13.2448 14.6932 13.7635C14.3501 14.2822 13.9054 14.726 13.386 15.068V17.578H16.618C18.509 15.836 19.6 13.273 19.6 10.228V10.227Z" fill="#4285F4"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99996 20C12.7 20 14.964 19.105 16.618 17.577L13.386 15.068C12.491 15.668 11.346 16.023 9.99996 16.023C7.39496 16.023 5.18996 14.263 4.40496 11.9H1.06396V14.49C1.89597 16.1468 3.17234 17.5395 4.7504 18.5126C6.32846 19.4856 8.14603 20.0006 9.99996 20Z" fill="#34A853"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M4.405 11.9C4.205 11.3 4.091 10.66 4.091 10C4.091 9.34001 4.205 8.70001 4.405 8.10001V5.51001H1.064C0.364015 6.90321 -0.000359433 8.44084 2.66054e-07 10C2.66054e-07 11.614 0.386 13.14 1.064 14.49L4.404 11.9H4.405Z" fill="#FBBC05"></path>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99996 3.977C11.468 3.977 12.786 4.482 13.823 5.473L16.691 2.605C14.959 0.99 12.695 0 9.99996 0C6.08996 0 2.70996 2.24 1.06396 5.51L4.40396 8.1C5.19196 5.736 7.39596 3.977 9.99996 3.977Z" fill="#EA4335"></path>
				</svg>
				<span>
					Sign up with Google
				</span>
			</button>

			<hr>

			<h2>Modals</h2>

			<div class="newspack-ui__box">

				<div class="newspack-ui__modal">
					<header class="newspack-ui__modal__header">
						<h2>This is a header</h2>
						<button class="newspack-blocks-modal__close newspack-ui__modal__close">
							<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
							</svg>
						</button>
					</header>

					<section class="newspack-ui__modal__content">
						<p>This is the modal content</p>
					</section>

					<footer class="newspack-ui__modal__footer">
						<p>This is the modal footer.</p>
					</footer>
				</div><!-- .newspack-ui__modal -->
			</div><!-- .newspack-ui__box -->

			<h2>Small size</h2>

			<div class="newspack-ui__box">
				<div class="newspack-ui__modal newspack-ui__modal__small">
					<header class="newspack-ui__modal__header">
						<h2>Auth Modal Contents Default</h2>

						<button class="newspack-blocks-modal__close newspack-ui__modal__close">
							<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
							</svg>
						</button>
					</header>

					<section class="newspack-ui__modal__content">

						<button class="newspack-ui__button__secondary newspack-ui__button__wide">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" clip-rule="evenodd" d="M19.6 10.227C19.6 9.51801 19.536 8.83701 19.418 8.18201H10V12.05H15.382C15.2706 12.6619 15.0363 13.2448 14.6932 13.7635C14.3501 14.2822 13.9054 14.726 13.386 15.068V17.578H16.618C18.509 15.836 19.6 13.273 19.6 10.228V10.227Z" fill="#4285F4"></path>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99996 20C12.7 20 14.964 19.105 16.618 17.577L13.386 15.068C12.491 15.668 11.346 16.023 9.99996 16.023C7.39496 16.023 5.18996 14.263 4.40496 11.9H1.06396V14.49C1.89597 16.1468 3.17234 17.5395 4.7504 18.5126C6.32846 19.4856 8.14603 20.0006 9.99996 20Z" fill="#34A853"></path>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M4.405 11.9C4.205 11.3 4.091 10.66 4.091 10C4.091 9.34001 4.205 8.70001 4.405 8.10001V5.51001H1.064C0.364015 6.90321 -0.000359433 8.44084 2.66054e-07 10C2.66054e-07 11.614 0.386 13.14 1.064 14.49L4.404 11.9H4.405Z" fill="#FBBC05"></path>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M9.99996 3.977C11.468 3.977 12.786 4.482 13.823 5.473L16.691 2.605C14.959 0.99 12.695 0 9.99996 0C6.08996 0 2.70996 2.24 1.06396 5.51L4.40396 8.1C5.19196 5.736 7.39596 3.977 9.99996 3.977Z" fill="#EA4335"></path>
							</svg>
							<span>
								Sign in with Google
							</span>
						</button>

						<div class="newspack-ui__word-divider">
							Or
						</div>

						<form>
							<p>
								<label for="email-input-demo">Email input</label>
								<input type="email" placeholder="Email Address">
							</p>

							<button class="newspack-ui__button__primary newspack-ui__button__wide">Sign In</button>
							<button class="newspack-ui__button__tertiary newspack-ui__button__wide">Sign in to existing account</button>
						</form>
					</section>

					<footer class="newspack-ui__modal__footer">
						<p>This is the modal footer.</p>
					</footer>
				</div><!-- .newspack-ui__modal__small -->
			</div><!-- .newspack-ui__box -->

			<div class="newspack-ui__box">
				<div class="newspack-ui__modal newspack-ui__modal__small">
					<header class="newspack-ui__modal__header">
						<h2>Auth Modal Contents OTP</h2>

						<button class="newspack-blocks-modal__close newspack-ui__modal__close">
							<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
							</svg>
						</button>
					</header>

					<section class="newspack-ui__modal__content">
						<form>
							<p>
								<label>Entry the code sent to your email</label>
								<div class="newspack-ui__code-input">
									<input type="text" maxlength="1">
									<input type="text" maxlength="1">
									<input type="text" maxlength="1">
									<input type="text" maxlength="1">
									<input type="text" maxlength="1">
									<input type="text" maxlength="1">
								</div>
							</p>

							<p class="newspack-ui__font__small">Sign in by entering the code sent to email@address.com, or by clicking the magic link in the email.</p>

							<button class="newspack-ui__button__primary newspack-ui__button__wide">Continue</button>
							<button class="newspack-ui__button__secondary newspack-ui__button__wide">Resend Code</button>
							<button class="newspack-ui__button__tertiary newspack-ui__button__wide">Go Back</button>
						</form>
					</section>
				</div><!-- .newspack-ui__modal__small -->
			</div><!-- .newspack-ui__box -->

			<div class="newspack-ui__box">
				<div class="newspack-ui__modal newspack-ui__modal__small">
					<header class="newspack-ui__modal__header">
						<h2>Auth Modal Contents Success</h2>

						<button class="newspack-blocks-modal__close newspack-ui__modal__close">
							<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
							</svg>
						</button>
					</header>

					<section class="newspack-ui__modal__content">

						<div class="newspack-ui__box newspack-ui__box__success newspack-ui__box__text-center">
							<span class="newspack-ui__icon newspack-ui__icon__success">
								<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
								</svg>
							</span>

							<p>
								<strong>Success! Your account was created and you're signed in.</strong>
							</p>

							<p class="newspack-ui__font__small">In the future, you'll sign in with a code sent to your email. If you'd rather use a password, you can set one in <a href="#">My Account</a>.</p>
						</div>


						<button class="newspack-ui__button__primary newspack-ui__button__wide">Continue</button>
					</section>
				</div><!-- .newspack-ui__modal__small -->
			</div><!-- .newspack-ui__box -->


			<div class="newspack-ui__box">
				<div class="newspack-ui__modal newspack-ui__modal__small">
					<header class="newspack-ui__modal__header">
						<h2>Auth Modal Contents Success + PW</h2>

						<button class="newspack-blocks-modal__close newspack-ui__modal__close">
							<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
							</svg>
						</button>
					</header>

					<section class="newspack-ui__modal__content">

						<div class="newspack-ui__box newspack-ui__box__success newspack-ui__box__text-center">
							<span class="newspack-ui__icon newspack-ui__icon__success">
								<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
								</svg>
							</span>

							<p>
								<strong>Success! Your account was created and you're signed in.</strong>
							</p>
						</div>

						<form>
							<p>
								<label>Set a display name</label>
								<input type="text">
								<span class="newspack-ui__field-description">This will be used to address you in emails, and when you leave comments.</span>
							</p>

							<p>
								<label>Create password</label>
								<input type="password">
							</p>
							<p>
								<label>Confirm Password</label>
								<input type="password">
								<span class="newspack-ui__field-description">If you don't set a password, you can always log in with a magic link or one-time code sent to your email.</span>
							</p>
						</form>

						<button class="newspack-ui__button__primary newspack-ui__button__wide">Continue</button>
						<button class="newspack-ui__button__secondary newspack-ui__button__wide">Skip for now</button>
					</section>
				</div><!-- .newspack-ui__modal__small -->
			</div><!-- .newspack-ui__box -->


			<div class="newspack-ui__box">
				<div class="newspack-ui__modal newspack-ui__modal__small">
					<header class="newspack-ui__modal__header">
						<h2>Auth Modal Newsletter Sign Up</h2>

						<button class="newspack-blocks-modal__close newspack-ui__modal__close">
							<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
								<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
							</svg>
						</button>
					</header>

					<section class="newspack-ui__modal__content">

						<p class="newspack-ui__font__small">Get the best of The News Paper directly to your email inbox.<br>
						<span class="newspack-ui__color-text-gray">Sending to: email@address.</span></p>

						<label class="newspack-ui__input-checkradio newspack-ui__input-list">
							<input type="checkbox" name="checkbox-option-1">
							<span>
								<strong>The Weekly</strong><br>
								Friday roundup of the most relevant stories.
							</span>
						</label>

						<label class="newspack-ui__input-checkradio newspack-ui__input-list">
							<input type="checkbox" name="checkbox-option-2">
							<span>
								<strong>The Weekly</strong><br>
								Friday roundup of the most relevant stories.
							</span>
						</label>

						<button class="newspack-ui__button__primary newspack-ui__button__wide">Continue</button>
					</section>
				</div><!-- .newspack-ui__modal__small -->
			</div><!-- .newspack-ui__box -->

		</div><!-- .newspack-ui -->
		<?php
		return ob_get_clean();
	}

	/**
	 * Append the demo content when the ui-demo query string is used.
	 *
	 * @param string $content The page content.
	 * @return string Modified $content with demo appended.
	 */
	public static function load_demo( $content ) {
		if ( isset( $_REQUEST['ui-demo'] ) && current_user_can('administrator') ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$content .= self::return_demo_content();
		}
		return $content;
	}
}
Newspack_UI::init();
