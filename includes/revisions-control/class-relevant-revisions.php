<?php
/**
 * Adds a filter by author to the Posts page in the Admin dashboard.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Post;

require_once 'class-relevant-revision.php';

/**
 * Author Filter class
 */
class Relevant_Revisions {

	/**
	 * Flag to make sure hooks are initialized only once
	 *
	 * @var boolean
	 */
	private static $initiated = false;

	/**
	 * The name of the post meta that stores the relevant revisions IDs
	 *
	 * @var string
	 */
	const RELEVANT_IDS_META_KEY = '_relevant_revision';

	/**
	 * Initializes the hook
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initiated ) {
			add_action( 'load-revision.php', array( __CLASS__, 'admin_init' ) );
			add_action( 'wp_ajax_newspack_toggle_revision_relevant', array( __CLASS__, 'ajax_toggle_relevant' ) );
			add_filter( 'wp_prepare_revision_for_js', array( __CLASS__, 'filter_revision_for_js' ), 10, 3 );
			self::$initiated = true;
		}
	}

	/**
	 * Initializes the revisions page
	 *
	 * @return void
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Enqueues js script
	 *
	 * @return void
	 */
	public static function enqueue_scripts() {
		wp_enqueue_script(
			'newspack_revisions_control',
			Newspack::plugin_url() . '/includes/revisions-control/newspack-revisions.js',
			[ 'jquery' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		wp_localize_script(
			'newspack_revisions_control',
			'newspack_revisions_control',
			[
				'ajax_url'            => admin_url( 'admin-ajax.php' ),
				'mark_relevant_nonce' => wp_create_nonce( 'newspack_mark_relevant' ),
			]
		);
	}



	/**
	 * Filters the revision object used in the Backbone JS app
	 *
	 * @param array   $revisions_data The revision data we are filtering.
	 * @param WP_Post $revision       The revision's WP_Post object.
	 * @param WP_Post $post           The revision's parent WP_Post object.
	 * @return array
	 */
	public static function filter_revision_for_js( $revisions_data, $revision, $post ) {
		$revision                            = new Relevant_Revision( $post->ID, $revision->ID );
		$revisions_data['newspack_relevant'] = $revision->is_relevant();
		return $revisions_data;
	}

	/**
	 * Ajax callback to toggle the revision relevance
	 *
	 * @return void
	 */
	public static function ajax_toggle_relevant() {
		check_ajax_referer( 'newspack_mark_relevant' );

		$revision_id = ! empty( $_POST['revision_id'] ) ? intval( $_POST['revision_id'] ) : null;
		$post_id     = ! empty( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : null;

		if ( ! $revision_id || ! $post_id ) {
			exit;
		}

		$revision      = new Relevant_Revision( $post_id, $revision_id );
		$current_state = $revision->toggle();

		echo wp_json_encode( [ 'relevant' => $current_state ] );
		die;
	}

}

Relevant_Revisions::init();
