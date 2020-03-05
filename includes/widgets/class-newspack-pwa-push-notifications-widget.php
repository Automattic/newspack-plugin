<?php
/**
 * Newspack PWA Push Notifications Widget
 *
 * @package Newspack
 */

use \Newspack\PWA;
use \Newspack\Configuration_Managers;

/**
 * Newspack PWA Push Notifications Widget
 */
class Newspack_PWA_Push_Notifications_Widget extends \WP_Widget {

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct(
			'newspack-pwa-push-notifications-widget',
			'Newspack Push Notifications'
		);
		add_action(
			'widgets_init',
			function() {
				register_widget( 'Newspack_PWA_Push_Notifications_Widget' );
			}
		);
	}

	/**
	 * Constructor
	 *
	 * @var args Widget args.
	 */
	public $args = array(
		'before_widget' => '<div class="widget-wrap">',
		'after_widget'  => '</div></div>',
	);

	/**
	 * Widget renderer.
	 *
	 * @param object $args Args.
	 * @param object $instance The Widget instance.
	 */
	public function widget( $args, $instance ) {
		include_once NEWSPACK_ABSPATH . 'includes/class-pwa.php';
		$is_amp = function_exists( 'is_amp_endpoint' ) && is_amp_endpoint();
		if ( ! $is_amp ) {
			return null;
		}
		$onesignal_cm = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'onesignal' );
		if ( ! $onesignal_cm->is_configured() || ! $onesignal_cm->get( 'app_id' ) ) {
			return null;
		}
		?>
		<amp-web-push-widget
			visibility="unsubscribed"
			layout="fixed"
			width="250"
			height="80"
			>
			<button on="tap:amp-web-push.subscribe"><?php echo esc_attr( __( 'Subscribe to Notifications', 'newspack' ) ); ?></button>
		</amp-web-push-widget>
		<!-- An unsubscription widget -->
		<amp-web-push-widget
			visibility="subscribed"
			layout="fixed"
			width="250"
			height="80"
		>
			<button on="tap:amp-web-push.unsubscribe"><?php echo esc_attr( __( 'Unsubscribe from Notifications', 'newspack' ) ); ?></button>
		</amp-web-push-widget>
		<?php
	}
}
$newspack_pwa_push_notifications_widget = new Newspack_PWA_Push_Notifications_Widget();
