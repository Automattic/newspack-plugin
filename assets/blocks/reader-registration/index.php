<?php
/**
 * Newspack Blocks.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\ReaderRegistration;

use Newspack;
use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

const FORM_ACTION = 'newspack_reader_registration';

/**
 * Do not register block hooks if Reader Activation is not enabled.
 */
if ( ! Reader_Activation::is_enabled() ) {
	return;
}

/**
 * Register block from metadata.
 */
function register_block() {
	\register_block_type_from_metadata(
		__DIR__ . '/block.json',
		array(
			'render_callback' => __NAMESPACE__ . '\\render_block',
		)
	);
	\register_block_style(
		'newspack/reader-registration',
		[
			'name'       => 'stacked',
			'label'      => __( 'Stacked', 'newspack' ),
			'is_default' => true,
		]
	);
	\register_block_style(
		'newspack/reader-registration',
		[
			'name'  => 'columns',
			'label' => __( 'Columns (newsletter subscription)', 'newspack' ),
		]
	);
}
add_action( 'init', __NAMESPACE__ . '\\register_block' );

/**
 * Enqueue front-end scripts.
 */
function enqueue_scripts() {
	$handle = 'newspack-reader-registration-block';
	\wp_enqueue_style(
		$handle,
		\Newspack\Newspack::plugin_url() . '/dist/reader-registration-block.css',
		[],
		NEWSPACK_PLUGIN_VERSION
	);
	\wp_enqueue_script(
		$handle,
		\Newspack\Newspack::plugin_url() . '/dist/reader-registration-block.js',
		[ 'wp-polyfill', 'newspack-reader-activation' ],
		NEWSPACK_PLUGIN_VERSION,
		true
	);
	\wp_script_add_data( $handle, 'async', true );
	\wp_script_add_data( $handle, 'amp-plus', true );
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_scripts' );

/**
 * Render Registration Block.
 *
 * @param array[] $attrs Block attributes.
 */
function render_block( $attrs ) {
	$block_id   = \wp_rand( 0, 99999 );
	$registered = false;
	$message    = '';

	/** Handle default attributes. */
	$default_attrs = [
		'style'            => 'stacked',
		'label'            => __( 'Sign up', 'newspack' ),
		'newsletterLabel'  => __( 'Subscribe to our newsletter', 'newspack' ),
		'haveAccountLabel' => __( 'Already have an account?', 'newspack' ),
		'signInLabel'      => __( 'Sign in', 'newspack' ),
	];
	$attrs         = \wp_parse_args( $attrs, $default_attrs );
	foreach ( $default_attrs as $key => $value ) {
		if ( empty( $attrs[ $key ] ) ) {
			$attrs[ $key ] = $value;
		}
	}

	$sign_in_url = \wp_login_url();
	if ( function_exists( 'wc_get_account_endpoint_url' ) ) {
		$sign_in_url = \wc_get_account_endpoint_url( 'dashboard' );
	}

	/** Setup list subscription */
	if ( $attrs['newsletterSubscription'] && method_exists( 'Newspack_Newsletters_Subscription', 'get_lists_config' ) ) {
		$list_config     = \Newspack_Newsletters_Subscription::get_lists_config();
		$lists           = array_keys( $list_config );
		$list_map        = array_flip( $lists );
		$available_lists = array_values( array_intersect( $lists, $attrs['lists'] ) );
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	if (
		\is_user_logged_in() ||
		( isset( $_GET['newspack_reader'] ) && absint( $_GET['newspack_reader'] ) )
	) {
		$registered = true;
		$message    = __( 'Thank you for registering!', 'newspack' );
	}
	if ( isset( $_GET['newspack_reader'] ) && isset( $_GET['message'] ) ) {
		$message = \sanitize_text_field( $_GET['message'] );
	}
	// phpcs:enable

	ob_start();
	?>
	<div class="newspack-registration <?php echo esc_attr( get_block_classes( $attrs ) ); ?>">
		<?php if ( $registered ) : ?>
			<p class="message"><?php echo \esc_html( $message ); ?></p>
		<?php else : ?>
			<form>
				<?php \wp_nonce_field( FORM_ACTION, FORM_ACTION ); ?>
				<div class="newspack-registration__form-content">
					<?php if ( isset( $available_lists ) && ! empty( $available_lists ) ) : ?>
						<div class="newspack-registration__lists">
							<?php if ( 1 < count( $available_lists ) && ! empty( $attrs['newsletterTitle'] ) ) : ?>
								<h3><?php echo \esc_html( $attrs['newsletterTitle'] ); ?></h3>
							<?php endif; ?>
							<ul>
								<?php
								foreach ( $available_lists as $list_id ) :
									if ( ! isset( $list_config[ $list_id ] ) ) {
										continue;
									}
									$list        = $list_config[ $list_id ];
									$checkbox_id = sprintf( 'newspack-%s-list-checkbox-%s', $block_id, $list_id );
									?>
									<li>
										<span class="newspack-registration__lists__checkbox">
											<input
												type="checkbox"
												name="lists[]"
												value="<?php echo \esc_attr( $list_id ); ?>"
												id="<?php echo \esc_attr( $checkbox_id ); ?>"
												<?php if ( isset( $list_map[ $list_id ] ) ) : ?>
													checked
												<?php endif; ?>
											/>
										</span>
										<span class="newspack-registration__lists__details">
											<label class="newspack-registration__lists__label" for="<?php echo \esc_attr( $checkbox_id ); ?>">
												<span class="newspack-registration__lists__title">
													<?php
													if ( 1 === count( $available_lists ) ) {
														echo $attrs['newsletterLabel']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
													} else {
														echo \esc_html( $list['title'] );
													}
													?>
												</span>
												<?php if ( $attrs['displayListDescription'] ) : ?>
													<span class="newspack-registration__lists__description"><?php echo \esc_html( $list['description'] ); ?></span>
												<?php endif; ?>
											</label>
										</span>
									</li>
								<?php endforeach; ?>
							</ul>
						</div>
					<?php endif; ?>
					<div class="newspack-registration__main">
						<div class="newspack-registration__inputs">
							<input type="email" name="email" autocomplete="email" placeholder="<?php echo \esc_attr( $attrs['placeholder'] ); ?>" />
							<input type="submit" value="<?php echo \esc_attr( $attrs['label'] ); ?>" />
						</div>

						<?php if ( Newspack\Google_OAuth::is_oauth_configured() ) : ?>
							<div class="newspack-registration__logins">
								<div class="newspack-registration__logins__separator">
									<div></div>
									<div>
										<?php echo \esc_html__( 'OR', 'newspack' ); ?>
									</div>
									<div></div>
								</div>
								<button class="newspack-registration__logins__google">
									<?php echo file_get_contents( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/blocks/reader-registration/icons/google.svg' ); // phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped ?>
									<span>
										<?php echo \esc_html__( 'Sign in with Google', 'newspack' ); ?>
									</span>
								</button>
							</div>
						<?php endif; ?>
						<div class="newspack-registration__response">
							<?php if ( ! empty( $message ) ) : ?>
								<p><?php echo \esc_html( $message ); ?></p>
							<?php endif; ?>
						</div>

						<div class="newspack-registration__help-text">
							<p>
								<?php echo $attrs['privacyLabel']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							</p>
							<p>
								<?php echo \esc_html( $attrs['haveAccountLabel'] ); ?>
								<a href="<?php echo \esc_url( $sign_in_url ); ?>" data-newspack-reader-account-link><?php echo \esc_html( $attrs['signInLabel'] ); ?></a>
							</p>
						</div>
					</div>
				</div>
			</form>
		<?php endif; ?>
	</div>
	<?php
		// Including a dummy element with used classes to prevent AMP stripping them.
	?>
	<div class="newspack-registration--in-progress newspack-registration--error newspack-registration--success"></div>
	<?php
	return ob_get_clean();
}

/**
 * Utility to assemble the class for a server-side rendered block.
 *
 * @param array $attrs Block attributes.
 *
 * @return string Class list separated by spaces.
 */
function get_block_classes( $attrs = [] ) {
	$classes = [];
	if ( isset( $attrs['align'] ) && ! empty( $attrs['align'] ) ) {
		$classes[] = 'align' . $attrs['align'];
	}
	if ( isset( $attrs['className'] ) ) {
		array_push( $classes, $attrs['className'] );
	}
	return implode( ' ', $classes );
}

/**
 * Send the form response to the client, whether it's a JSON or GET request.
 *
 * @param mixed  $data    The response to send to the client.
 * @param string $message Optional custom message.
 */
function send_form_response( $data, $message = '' ) {
	$is_error = \is_wp_error( $data );
	if ( empty( $message ) ) {
		$message = $is_error ? $data->get_error_message() : __( 'Thank you for registering!', 'newspack' );
	}
	if ( \wp_is_json_request() ) {
		\wp_send_json( compact( 'message', 'data' ), \is_wp_error( $data ) ? 400 : 200 );
		exit;
	} elseif ( isset( $_SERVER['REQUEST_METHOD'] ) && 'GET' === $_SERVER['REQUEST_METHOD'] ) {
		$args_to_remove = [
			'_wp_http_referer',
			FORM_ACTION,
		];
		if ( ! $is_error ) {
			$args_to_remove = array_merge( $args_to_remove, [ 'email', 'lists' ] );
		}
		\wp_safe_redirect(
			\add_query_arg(
				[
					'newspack_reader' => $is_error ? '0' : '1',
					'message'         => $message,
				],
				\remove_query_arg( $args_to_remove )
			)
		);
		exit;
	}
}

/**
 * Process registration form.
 */
function process_form() {
	if ( ! isset( $_REQUEST[ FORM_ACTION ] ) || ! \wp_verify_nonce( \sanitize_text_field( $_REQUEST[ FORM_ACTION ] ), FORM_ACTION ) ) {
		return;
	}

	if ( ! isset( $_REQUEST['email'] ) || empty( $_REQUEST['email'] ) ) {
		return send_form_response( new \WP_Error( 'invalid_email', __( 'You must enter a valid email address.', 'newspack' ) ) );
	}

	$metadata = [];
	$lists    = array_map( 'sanitize_text_field', isset( $_REQUEST['lists'] ) ? $_REQUEST['lists'] : [] );
	if ( ! empty( $lists ) ) {
		$metadata['lists'] = $lists;
	}

	$email   = \sanitize_email( $_REQUEST['email'] );
	$user_id = Reader_Activation::register_reader( $email, '', true, $metadata );

	/**
	 * Fires after a reader is registered through the Reader Registration Block.
	 *
	 * @param string              $email   Email address of the reader.
	 * @param int|false|\WP_Error $user_id The created user ID in case of registration, false if not created or a WP_Error object.
	 */
	\do_action( 'newspack_reader_registration_form_processed', $email, $user_id );

	if ( \is_wp_error( $user_id ) ) {
		return send_form_response( $user_id );
	}

	$user_logged_in = false !== $user_id;

	if ( $user_logged_in ) {
		Reader_Activation::save_current_user_login_method( 'registration-block' );
	}

	return send_form_response(
		[
			'email'         => $email,
			'authenticated' => $user_logged_in,
		],
		$user_logged_in ? __( 'Thank you for registering!', 'newspack' ) : __( 'Check your email for a confirmation link!', 'newspack' )
	);
}
add_action( 'template_redirect', __NAMESPACE__ . '\\process_form' );
