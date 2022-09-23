<?php
/**
 * A class to handle relevant revisions checks and actions
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Post;

/**
 * Relevant Revision Object
 */
class Relevant_Revision {

	/**
	 * The name of the post meta that stores the relevant revisions IDs
	 *
	 * @var string
	 */
	const RELEVANT_IDS_META_KEY = '_relevant_revision';

	/**
	 * The meta key used to store the information of the ID of the revision a backup is of
	 *
	 * @var string
	 */
	const BKP_FOR_OF = '_bkp_of';

	/**
	 * The revision ID
	 *
	 * @var int
	 */
	public $ID;

	/**
	 * The post ID that the revision is attached to
	 *
	 * @var int
	 */

	public $post_id;

	/**
	 * Initializes an instance
	 *
	 * @param string|int $post_id The post ID that the revision is attached to.
	 * @param string|int $revision_id The revision ID.
	 */
	public function __construct( $post_id, $revision_id ) {
		$this->ID      = $revision_id;
		$this->post_id = $post_id;
	}

	/**
	 * Gets the relevant revisions ids for the current post
	 *
	 * @return array
	 */
	public function get_post_revisions() {
		return get_post_meta( $this->post_id, self::RELEVANT_IDS_META_KEY );
	}

	/**
	 * Verifies if a given revision of a post is marked as relevant
	 *
	 * @return boolean
	 */
	public function is_relevant() {
		$revisions = $this->get_post_revisions();
		return in_array( (string) $this->ID, $revisions, true );
	}

	/**
	 * Marks the revision as relevant
	 *
	 * @return void
	 */
	public function mark_as_relevant() {
		if ( ! $this->is_relevant() ) {
			add_post_meta( $this->post_id, self::RELEVANT_IDS_META_KEY, $this->ID );
			$this->create_backup();
		}
	}

	/**
	 * Unmarks the revision as relevant
	 *
	 * @return void
	 */
	public function unmark_as_relevant() {
		delete_post_meta( $this->post_id, self::RELEVANT_IDS_META_KEY, $this->ID );
		$this->delete_backup();
	}

	/**
	 * Toggles the revision relevance
	 *
	 * @return bool The resulting state
	 */
	public function toggle() {
		if ( ! $this->is_relevant() ) {
			$this->mark_as_relevant();
			return true;
		}
		$this->unmark_as_relevant();
		return false;
	}

	/**
	 * Creates a backup of the current revision
	 *
	 * @return bool
	 */
	public function create_backup() {

		$revision = get_post( $this->ID );
		if ( ! $revision ) {
			return false;
		}
		unset( $revision->ID );
		$revision->post_type = Relevant_Revisions::BKP_POST_TYPE;
		$backup              = wp_insert_post( $revision );

		add_post_meta( $backup, self::BKP_FOR_OF, $this->ID );

		$this->copy_metadata( $this->ID, $backup );
		return true;
	}

	/**
	 * Copies the metadata from one post to another
	 *
	 * @param int $from The ID of the post to copy the metadata from.
	 * @param int $to The ID of the post to copy the metadata to.
	 * @return void
	 */
	public function copy_metadata( $from, $to ) {
		$from_meta = get_metadata( 'post', $from );
		foreach ( $from_meta as $key => $values ) {
			if ( self::BKP_FOR_OF === $key ) {
				continue;
			}
			foreach ( $values as $value ) {
				// Use add_metadata to avoid hooks that would save revisions metadata into the parent post.
				add_metadata( 'post', $to, $key, $value );
			}
		}
	}

	/**
	 * Gets the ID of the backup of the current revision, if it exists
	 *
	 * @return ?int
	 */
	public function get_backup_id() {
		global $wpdb;
		static $backup_id;
		if ( ! $backup_id ) {
			// phpcs:ignore
			$backup_id = $wpdb->get_var( $wpdb->prepare( "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = %s AND meta_value = %d", self::BKP_FOR_OF, $this->ID ) );
		}
		return $backup_id;
	}

	/**
	 * Deletes the backup of the current revision
	 *
	 * @return WP_Post|false|null Post data on success, false or null on failure.
	 */
	public function delete_backup() {
		return wp_delete_post( $this->get_backup_id(), true );
	}

	/**
	 * Restores a backup
	 *
	 * @return bool
	 */
	public function restore_backup() {
		$backup_id = $this->get_backup_id();
		if ( ! $backup_id ) {
			return false;
		}
		$backup = get_post( $backup_id );
		unset( $backup->ID );
		$backup->post_type = 'revision';
		$restore           = wp_insert_post( $backup );

		$this->copy_metadata( $backup_id, $restore );

		$this->unmark_as_relevant();
		$new_revision = new Relevant_Revision( $this->post_id, $restore );
		$new_revision->mark_as_relevant();
	}

}
