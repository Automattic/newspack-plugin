<?php
/**
 * Unit tests for the Collection Section Taxonomy handler.
 *
 * @package Newspack\Tests
 * @covers \Newspack\Collections\Collection_Section_Taxonomy
 */

namespace Newspack\Tests\Unit\Collections;

use WP_UnitTestCase;
use Newspack\Collections\Collection_Section_Taxonomy;
use Newspack\Collections\Post_Type;

/**
 * Test the Collection Section Taxonomy functionality.
 */
class Test_Collection_Section_Taxonomy extends WP_UnitTestCase {
	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();
		Collection_Section_Taxonomy::register_taxonomy();
	}

	/**
	 * Test that the taxonomy is registered.
	 *
	 * @covers \Newspack\Collections\Collection_Section_Taxonomy::register_taxonomy
	 */
	public function test_taxonomy_registration() {
		$taxonomy = get_taxonomy( Collection_Section_Taxonomy::get_taxonomy() );
		$this->assertNotNull( $taxonomy, 'Taxonomy should be registered.' );
		$this->assertEquals( 'Collection Sections', $taxonomy->labels->name, 'Taxonomy label should be "Collection Sections".' );
		$this->assertTrue( $taxonomy->public, 'Taxonomy should be public.' );
		$this->assertContains( 'post', $taxonomy->object_type, 'Taxonomy should be associated with posts.' );
	}

	/**
	 * Test that a collection section term can be created.
	 *
	 * @covers \Newspack\Collections\Collection_Section_Taxonomy::register_taxonomy
	 */
	public function test_create_collection_section() {
		$args = [
			'name' => 'Test Section',
			'slug' => 'test-section',
		];

		$term = wp_insert_term( $args['name'], Collection_Section_Taxonomy::get_taxonomy(), $args );
		$this->assertNotWPError( $term, 'Term should be created successfully.' );

		$created_term = get_term( $term['term_id'], Collection_Section_Taxonomy::get_taxonomy() );
		$this->assertEquals( $args['name'], $created_term->name, 'Term name should be set correctly.' );
		$this->assertEquals( $args['slug'], $created_term->slug, 'Term slug should be set correctly.' );
	}

	/**
	 * Test set_parent_menu returns the collections menu slug when taxonomy matches.
	 */
	public function test_set_parent_menu_returns_collections_menu_when_taxonomy_matches() {
		global $current_screen;
		$current_screen = (object) [ 'taxonomy' => Collection_Section_Taxonomy::get_taxonomy() ]; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$original = 'edit.php';
		$result = Collection_Section_Taxonomy::set_parent_menu( $original );
		$this->assertEquals(
			'edit.php?post_type=' . Post_Type::get_post_type(),
			$result,
			'Should return the collections menu slug when taxonomy matches.'
		);
	}

	/**
	 * Test set_parent_menu returns the original parent file when taxonomy does not match.
	 */
	public function test_set_parent_menu_returns_original_when_taxonomy_does_not_match() {
		global $current_screen;
		$current_screen = (object) [ 'taxonomy' => 'other_taxonomy' ]; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$original = 'edit.php';
		$result = Collection_Section_Taxonomy::set_parent_menu( $original );
		$this->assertEquals(
			$original,
			$result,
			'Should return the original parent file when taxonomy does not match.'
		);
	}

	/**
	 * Test that set_taxonomy_column_name changes the taxonomy column label to 'Sections'.
	 *
	 * @covers \Newspack\Collections\Collection_Section_Taxonomy::set_taxonomy_column_name
	 */
	public function test_set_taxonomy_column_name() {
		$columns = [
			'cb'    => '<input type="checkbox" />',
			'title' => 'Title',
			'taxonomy-' . Collection_Section_Taxonomy::get_taxonomy() => 'Collection Sections',
			'date'  => 'Date',
		];

		$result = Collection_Section_Taxonomy::set_taxonomy_column_name( $columns );

		$this->assertEquals(
			'Sections',
			$result[ 'taxonomy-' . Collection_Section_Taxonomy::get_taxonomy() ],
			'The taxonomy column label should be changed to "Sections".'
		);
	}
}
