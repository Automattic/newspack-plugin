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
		}
	}

	/**
	 * Unmarks the revision as relevant
	 *
	 * @return void
	 */
	public function unmark_as_relevant() {
		delete_post_meta( $this->post_id, self::RELEVANT_IDS_META_KEY, $this->ID );
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

}
