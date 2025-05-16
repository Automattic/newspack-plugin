<?php
/**
 * Newspack "My Account" customizations v1.x.x.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack "My Account" customizations v1.x.x.
 */
class My_Account_UI_V1 {
	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		\add_filter( 'body_class', [ __CLASS__, 'add_body_class' ] );
		\add_filter( 'do_shortcode_tag', [ __CLASS__, 'add_newspack_ui_wrapper' ], 10, 2 );
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ], 11 );
		\add_filter( 'wc_get_template', [ __CLASS__, 'wc_get_template' ], 10, 5 );
		\add_action( 'woocommerce_subscription_details_table', [ __CLASS__, 'cancel_subscription_modal' ] );
	}

	/**
	 * Add a body class to the My Account page.
	 *
	 * @param array $classes The body classes.
	 * @return array The body classes.
	 */
	public static function add_body_class( $classes ) {
		if ( function_exists( 'is_account_page' ) && \is_account_page() ) {
			$classes[] = 'newspack-my-account';
			$classes[] = 'newspack-my-account--v1';
			if ( ! \is_user_logged_in() ) {
				$classes[] = 'newspack-my-account--logged-out';
			} else {
				$classes[] = 'newspack-my-account--logged-in';
			}
		}
		return $classes;
	}

	/**
	 * Render a wrapper element to apply Newspack UI styles to My Account page content.
	 *
	 * @param string $output The output.
	 * @param string $tag The tag.
	 *
	 * @return string The output.
	 */
	public static function add_newspack_ui_wrapper( $output, $tag ) {
		if ( 'woocommerce_my_account' === $tag ) {
			return '<div class="newspack-ui">' . $output . '</div>';
		}
		return $output;
	}

	/**
	 * Enqueue assets.
	 */
	public static function enqueue_assets() {
		if ( function_exists( 'is_account_page' ) && \is_account_page() ) {
			\wp_enqueue_script(
				'my-account-v1',
				\Newspack\Newspack::plugin_url() . '/dist/my-account-v1.js',
				[ 'my-account' ],
				NEWSPACK_PLUGIN_VERSION,
				true
			);

			// Dequeue styles from the Newspack theme first, for a fresh start.
			\wp_dequeue_style( 'newspack-woocommerce-style' );
			\wp_enqueue_style(
				'my-account-v1',
				\Newspack\Newspack::plugin_url() . '/dist/my-account-v1.css',
				[],
				NEWSPACK_PLUGIN_VERSION
			);
		}
	}

	/**
	 * WC's page templates hijacking.
	 *
	 * @param string $template      Template path.
	 * @param string $template_name Template name.
	 */
	public static function wc_get_template( $template, $template_name ) {
		switch ( $template_name ) {
			case 'myaccount/form-login.php':
				if ( isset( $_GET[ WooCommerce_My_Account::AFTER_ACCOUNT_DELETION_PARAM ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
					return __DIR__ . '/templates/myaccount-after-delete-account.php';
				}
				return $template;
			case 'myaccount/form-edit-account.php':
				if ( isset( $_GET[ WooCommerce_My_Account::DELETE_ACCOUNT_FORM ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
					return __DIR__ . '/templates/myaccount-delete-account.php';
				}
				return __DIR__ . '/templates/myaccount-edit-account.php';
			default:
				return $template;
		}
	}

	/**
	 * Generate markup for a Newspack UI modal.
	 *
	 * @param array $args {
	 *     Arguments for building the modal.
	 *     @type string $id The modal ID.
	 *     @type string $title The modal title.
	 *     @type string $content The modal content HTML.
	 *     @type string $footer The modal footer HTML.
	 *     @type array $actions {
	 *         @type string $label The button label.
	 *         @type string $type The button type.
	 *         @type string $action The action to perform when the button is clicked.
	 *         @type string $url The URL to navigate to when the button is clicked.
	 *     }
	 * }
	 */
	public static function generate_modal( $args ) {
		$args = wp_parse_args(
			$args,
			[
				'id'   => 'modal-' . wp_rand( 1, 1000 ),
				'size' => 'small',
			]
		);
		?>
		<div id="newspack-my-account__<?php echo esc_attr( $args['id'] ); ?>" class="newspack-ui__modal-container" data-state="closed">
			<div class="newspack-ui__modal-container__overlay"></div>
			<div class="newspack-ui__modal newspack-ui__modal--<?php echo esc_attr( $args['size'] ); ?>">
				<header class="newspack-ui__modal__header">
					<?php if ( ! empty( $args['title'] ) ) : ?>
						<h2 class="newspack-ui__font--l"><?php echo wp_kses_post( $args['title'] ); ?></h2>
					<?php endif; ?>
					<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close">
						<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
						<?php Newspack_UI_Icons::print_svg( 'close' ); ?>
					</button>
				</header>

				<section class="newspack-ui__modal__content">
					<?php echo wp_kses_post( $args['content'] ); ?>
					<?php
					if ( ! empty( $args['actions'] ) ) :
						foreach ( $args['actions'] as $action ) :
							$classes = [
								'newspack-ui__button',
								'newspack-ui__button--wide',
								'newspack-ui__button--' . ( $action['type'] ?? 'secondary' ),
							];
							if ( ! empty( $action['action'] ) ) {
								$classes[] = 'newspack-ui__modal__' . $action['action'];
							}
							?>
							<?php if ( isset( $action['url'] ) ) : ?>
								<a href="<?php echo esc_url( $action['url'] ); ?>" class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
									<?php echo wp_kses_post( $action['label'] ); ?>
								</a>
							<?php else : ?>
								<button class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
									<?php echo wp_kses_post( $action['label'] ); ?>
								</button>
								<?php
							endif;
						endforeach;
						endif;
					?>
				</section>
				<?php if ( ! empty( $args['footer'] ) ) : ?>
				<footer class="newspack-ui__modal__footer">
					<?php echo wp_kses_post( $args['footer'] ); ?>
				</footer>
				<?php endif; ?>
			</div><!-- .newspack-ui__modal__small -->
		</div> <!-- .newspack-ui__modal-container -->
		<?php
	}

	/**
	 * Confirmation modal to cancel a subscription.
	 *
	 * @param WC_Subscription $subscription The subscription.
	 */
	public static function cancel_subscription_modal( $subscription ) {
		if ( ! $subscription || ! is_a( $subscription, 'WC_Subscription' ) ) {
			return;
		}
		$next_payment = $subscription->get_time( 'next_payment' );
		if (
			// See: wcs_get_all_user_actions_for_subscription().
			$subscription->can_be_updated_to( 'cancelled' ) && ! $subscription->is_one_payment() &&
			(
				( $subscription->has_status( 'on-hold' ) && empty( $next_payment ) ) ||
				$next_payment > 0
			)
		) {
			$next_payment_date = $next_payment ? $subscription->get_date_to_display( 'next_payment' ) : null;
			ob_start();
			?>
			<h2 class="font-size newspack-ui__font--l">
				<?php esc_html_e( 'Are you sure?', 'newspack-plugin' ); ?>
			</h2>
			<p>
				<?php
				echo wp_kses_post(
					sprintf(
					// Translators: %s is either the next payment date, or a generic explanation of when the subscription will end if cancelled.
						__( 'If you cancel now, your subscription will remain active until %s.', 'newspack-plugin' ),
						"<strong>$next_payment_date</strong>" ?? __( 'the end of your current billing period', 'newspack-plugin' )
					)
				);
				?>
			</p>
			<p>
				<?php esc_html_e( 'After this, your subscription access will end unless you choose to renew.', 'newspack-plugin' ); ?>
			</p>
			<?php
			$content = ob_get_clean();
			self::generate_modal(
				[
					'id'      => 'confirm-subscription-cancellation',
					'title'   => __( 'Cancel subscription', 'newspack-plugin' ),
					'content' => $content,
					'actions' => [
						'confirm' => [
							'label' => __( 'Cancel subscription', 'newspack-plugin' ),
							'type'  => 'destructive',
							'url'   => \wcs_get_users_change_status_link( $subscription->get_id(), 'cancelled' ),
						],
						'cancel'  => [
							'label'  => __( 'Keep subscription', 'newspack-plugin' ),
							'type'   => 'ghost',
							'action' => 'close',
						],
					],
				]
			);
		}
	}
}
My_Account_UI_V1::init();
