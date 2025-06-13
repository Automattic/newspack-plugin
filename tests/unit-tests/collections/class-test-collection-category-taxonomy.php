<?php
/**
 * Unit tests for the Collection Category Taxonomy handler.
 *
 * @package Newspack\Tests
 * @covers \Newspack\Collections\Collection_Category_Taxonomy
 */

namespace Newspack\Tests\Unit\Collections;

use WP_UnitTestCase;
use Newspack\Collections\Collection_Category_Taxonomy;
use Newspack\Collections\Post_Type;
use Newspack\Collections\Settings;

/**
 * Test the Collection Category Taxonomy functionality.
 */
class Test_Collection_Category_Taxonomy extends WP_UnitTestCase {
	use Traits\Trait_Collections_Test;

	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Register post type and taxonomy directly as the WP environment is already initialized.
		Post_Type::register_post_type();
		Collection_Category_Taxonomy::register_taxonomy();
	}

	/**
	 * Test that the taxonomy is registered.
	 *
	 * @covers \Newspack\Collections\Collection_Category_Taxonomy::register_taxonomy
	 */
	public function test_taxonomy_registration() {
		$taxonomy = get_taxonomy( Collection_Category_Taxonomy::get_taxonomy() );
		$this->assertNotNull( $taxonomy, 'Taxonomy should be registered.' );
		$this->assertEquals( 'Collection Categories', $taxonomy->labels->name, 'Taxonomy label should be "Collection Categories".' );
		$this->assertTrue( $taxonomy->public, 'Taxonomy should be public.' );
		$this->assertContains( Post_Type::get_post_type(), $taxonomy->object_type, 'Taxonomy should be associated with collection post type.' );
	}

	/**
	 * Test that set_taxonomy_column_name changes the taxonomy column label to 'Categories'.
	 *
	 * @covers \Newspack\Collections\Collection_Category_Taxonomy::set_taxonomy_column_name
	 */
	public function test_set_taxonomy_column_name() {
		$columns = [
			'cb'    => '<input type="checkbox" />',
			'title' => 'Title',
			'taxonomy-' . Collection_Category_Taxonomy::get_taxonomy() => 'Collection Categories',
			'date'  => 'Date',
		];

		$result = Collection_Category_Taxonomy::set_taxonomy_column_name( $columns );

		$this->assertEquals(
			'Categories',
			$result[ 'taxonomy-' . Collection_Category_Taxonomy::get_taxonomy() ],
			'The taxonomy column label should be changed to "Categories".'
		);
	}

	/**
	 * Test collection category taxonomy uses custom slug.
	 *
	 * @covers \Newspack\Collections\Collection_Category_Taxonomy::register_taxonomy
	 */
	public function test_collection_category_taxonomy_with_custom_slug() {
		$custom_slug = 'magazine';

		$custom_settings = [
			'custom_naming_enabled' => true,
			'custom_slug'           => $custom_slug,
		];
		update_option( Settings::OPTION_NAME, $custom_settings );

		Collection_Category_Taxonomy::register_taxonomy();

		$taxonomy = get_taxonomy( Collection_Category_Taxonomy::get_taxonomy() );
		$this->assertEquals( $custom_slug . '-category', $taxonomy->rewrite['slug'] );
	}
}
