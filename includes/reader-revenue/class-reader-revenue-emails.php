<?php
/**
 * Reader-revenue related emails.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Reader-revenue related emails.
 */
class Reader_Revenue_Emails {
	const POST_TYPE          = 'newspack_rr_email';
	const POST_TYPE_META     = 'newspack_email_type';
	const EMAIL_TYPE_RECEIPT = 'receipt';

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_cpt' ] );
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
		add_filter( 'newspack_newsletters_email_editor_cpts', [ __CLASS__, 'register_email_cpt_with_email_editor' ] );
	}

	/**
	 * Register the custom post type.
	 *
	 * @param array $email_editor_cpts Post type which should be edited as emails.
	 */
	public static function register_email_cpt_with_email_editor( $email_editor_cpts ) {
		$email_editor_cpts[] = self::POST_TYPE;
		return $email_editor_cpts;
	}

	/**
	 * Register the custom post type for emails.
	 */
	public static function register_cpt() {
		if ( ! current_user_can( 'edit_others_posts' ) ) {
			return;
		}

		$labels = [
			'name'                     => _x( 'Emails', 'post type general name', 'newspack' ),
			'singular_name'            => _x( 'Email', 'post type singular name', 'newspack' ),
			'menu_name'                => _x( 'Emails', 'admin menu', 'newspack' ),
			'name_admin_bar'           => _x( 'Email', 'add new on admin bar', 'newspack' ),
			'add_new'                  => _x( 'Add New', 'popup', 'newspack' ),
			'add_new_item'             => __( 'Add New Email', 'newspack' ),
			'new_item'                 => __( 'New Email', 'newspack' ),
			'edit_item'                => __( 'Edit Email', 'newspack' ),
			'view_item'                => __( 'View Email', 'newspack' ),
			'all_items'                => __( 'All Emails', 'newspack' ),
			'search_items'             => __( 'Search Emails', 'newspack' ),
			'parent_item_colon'        => __( 'Parent Emails:', 'newspack' ),
			'not_found'                => __( 'No Emails found.', 'newspack' ),
			'not_found_in_trash'       => __( 'No Emails found in Trash.', 'newspack' ),
			'items_list'               => __( 'Emails list', 'newspack' ),
			'item_published'           => __( 'Email published', 'newspack' ),
			'item_published_privately' => __( 'Email published privately', 'newspack' ),
			'item_reverted_to_draft'   => __( 'Email reverted to draft', 'newspack' ),
			'item_scheduled'           => __( 'Email scheduled', 'newspack' ),
			'item_updated'             => __( 'Email updated', 'newspack' ),
		];

		\register_post_type(
			self::POST_TYPE,
			[
				'public'       => false,
				'labels'       => $labels,
				'show_ui'      => true,
				'show_in_menu' => false,
				'show_in_rest' => true,
				'supports'     => [ 'editor', 'title', 'custom-fields' ],
				'taxonomies'   => [],
			]
		);
	}

	/**
	 * Register custom fields.
	 */
	public static function register_meta() {
		\register_meta(
			'post',
			self::POST_TYPE_META,
			[
				'object_subtype' => self::POST_TYPE,
				'show_in_rest'   => true,
				'type'           => 'string',
				'single'         => true,
				'auth_callback'  => '__return_true',
			]
		);
	}

	/**
	 * Send an HTML email.
	 *
	 * @param string $type Email type.
	 * @param string $to Recipient's email addesss.
	 * @param array  $placeholders Dynamic content substitutions.
	 */
	public static function send_email( $type, $to, $placeholders = [] ) {
		if ( ! self::has_emails_configured() ) {
			return;
		}
		$email_config = self::get_email_config_by_type( $type );
		if ( ! $to || false === $email_config ) {
			return;
		}
		$html = $email_config['html_payload'];
		foreach ( $placeholders as $value ) {
			$html = str_replace(
				$value['template'],
				$value['value'],
				$html
			);
		}
		$email_content_type = function() {
			return 'text/html';
		};
		add_filter( 'wp_mail_content_type', $email_content_type );
		$email_send_result = wp_mail( // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail
			$to,
			$email_config['subject'],
			$html,
			[
				sprintf( 'From: %s <%s>', get_bloginfo( 'name' ), get_bloginfo( 'admin_email' ) ),
			]
		);
		remove_filter( 'wp_mail_content_type', $email_content_type );
	}

	/**
	 * Load a template of an email.
	 *
	 * @param string $type Email type.
	 */
	private static function load_email_template( $type ) {
		$templates_directory = dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-revenue-emails/';
		return require $templates_directory . $type . '.php';
	}

	/**
	 * Does this instance support emails?
	 */
	private static function supports_emails() {
		if ( ! class_exists( 'Newspack_Newsletters' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Are emails configured on this instance?
	 */
	public static function has_emails_configured() {
		if ( ! self::supports_emails() ) {
			return false;
		}
		$receipt_email = self::get_email_config_by_type( self::EMAIL_TYPE_RECEIPT );
		if ( false === $receipt_email ) {
			return false;
		}
		return true;
	}

	/**
	 * Serialize an email config.
	 *
	 * @param string $type Type of the email.
	 * @param int    $post_id Email post id.
	 */
	private static function serialize_email( $type, $post_id = 0 ) {
		if ( ! self::supports_emails() ) {
			return false;
		}
		switch ( $type ) {
			case 'receipt':
				$label       = __( 'Receipt', 'newspack' );
				$description = __( "Email sent to the donor after they've donated.", 'newspack' );
				break;
			default:
				$label       = '';
				$description = '';
				break;
		}
		$html_payload = get_post_meta( $post_id, \Newspack_Newsletters::EMAIL_HTML_META, true );
		if ( ! $html_payload || empty( $html_payload ) ) {
			return false;
		}
		$serialized_email = [
			'label'        => $label,
			'description'  => $description,
			'post_id'      => $post_id,
			'edit_link'    => get_edit_post_link( $post_id, '' ),
			'subject'      => get_the_title( $post_id ),
			'html_payload' => $html_payload,
		];
		return $serialized_email;
	}

	/**
	 * Get the email for a specific type.
	 * If the email does not exist, it will be created based on default template.
	 *
	 * @param string $type Type of the email.
	 */
	private static function get_email_config_by_type( $type ) {
		$emails_query = new \WP_Query(
			[
				'post_type'      => self::POST_TYPE,
				'posts_per_page' => 1,
				'meta_key'       => self::POST_TYPE_META,
				'meta_value'     => $type, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			]
		);
		if ( $emails_query->post ) {
			return self::serialize_email( $type, $emails_query->post->ID );
		} else {
			$email_post_data                = self::load_email_template( self::EMAIL_TYPE_RECEIPT );
			$email_post_data['post_status'] = 'publish';
			$email_post_data['post_type']   = self::POST_TYPE;
			$email_post_data['meta_input']  = [
				self::POST_TYPE_META                   => self::EMAIL_TYPE_RECEIPT,
				\Newspack_Newsletters::EMAIL_HTML_META => $email_post_data['email_html'],
			];
			$post_id                        = wp_insert_post( $email_post_data );
			error_log( sprintf( 'Newspack: creating reader revenue email of type %s (id: %s).', $type, $post_id ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return self::serialize_email(
				self::EMAIL_TYPE_RECEIPT,
				$post_id
			);
		}
	}

	/**
	 * Get the emails per-purpose.
	 */
	public static function get_emails() {
		$emails = [];
		if ( ! self::supports_emails() ) {
			return $emails;
		}
		$receipt_email = self::get_email_config_by_type( self::EMAIL_TYPE_RECEIPT );
		if ( $receipt_email ) {
			$emails[ self::EMAIL_TYPE_RECEIPT ] = $receipt_email;
		}
		return $emails;
	}
}
Reader_Revenue_Emails::init();
