<?php
/**
 * Tests Donations features.
 *
 * @package Newspack\Tests
 */

use Newspack\Donations;
use Newspack\WooCommerce_Products;

require_once __DIR__ . '/../mocks/wc-mocks.php';

/**
 * Tests Donations features.
 */
class Newspack_Test_Donations extends WP_UnitTestCase {
	/**
	 * Settings.
	 */
	public function test_donations_settings_wc() {
		$donation_settings = Donations::get_donation_settings();
		self::assertTrue(
			is_wp_error( $donation_settings ),
			'Since WC is the default platform, donations settings return a WP error if WC plugins are not active.'
		);
		self::assertEquals(
			'wc',
			Donations::get_platform_slug(),
			'WC is the default donations platform.'
		);
	}

	/**
	 * Test that is_donation_product returns false for unflagged products.
	 *
	 * @group donations
	 */
	public function test_is_donation_product_unflagged() {
		$product_id = self::factory()->post->create( [ 'post_type' => 'product' ] );
		self::assertFalse(
			Donations::is_donation_product( $product_id ),
			'Unflagged product should not be a donation product.'
		);
	}

	/**
	 * Test that is_donation_product returns true for products with _newspack_is_donation meta.
	 *
	 * @group donations
	 */
	public function test_is_donation_product_flagged() {
		$product_id = self::factory()->post->create( [ 'post_type' => 'product' ] );
		update_post_meta( $product_id, WooCommerce_Products::DONATION_FLAG_META_KEY, wc_bool_to_string( true ) );
		self::assertTrue(
			Donations::is_donation_product( $product_id ),
			'Flagged product should be a donation product.'
		);
	}

	/**
	 * Test that is_donation_product returns false when meta is removed.
	 *
	 * @group donations
	 */
	public function test_is_donation_product_unflagged_after_removal() {
		$product_id = self::factory()->post->create( [ 'post_type' => 'product' ] );
		update_post_meta( $product_id, WooCommerce_Products::DONATION_FLAG_META_KEY, wc_bool_to_string( true ) );
		delete_post_meta( $product_id, WooCommerce_Products::DONATION_FLAG_META_KEY );
		self::assertFalse(
			Donations::is_donation_product( $product_id ),
			'Product should not be a donation product after meta removal.'
		);
	}

	/**
	 * Test get_flagged_donation_product_ids returns flagged product IDs.
	 *
	 * @group donations
	 */
	public function test_get_flagged_donation_product_ids() {
		$product_1 = self::factory()->post->create( [ 'post_type' => 'product' ] );
		$product_2 = self::factory()->post->create( [ 'post_type' => 'product' ] );
		$product_3 = self::factory()->post->create( [ 'post_type' => 'product' ] );
		update_post_meta( $product_1, WooCommerce_Products::DONATION_FLAG_META_KEY, wc_bool_to_string( true ) );
		update_post_meta( $product_3, WooCommerce_Products::DONATION_FLAG_META_KEY, wc_bool_to_string( true ) );

		$flagged_ids = Donations::get_flagged_donation_product_ids();
		self::assertContains( $product_1, $flagged_ids, 'Flagged product 1 should be in the list.' );
		self::assertNotContains( $product_2, $flagged_ids, 'Unflagged product 2 should not be in the list.' );
		self::assertContains( $product_3, $flagged_ids, 'Flagged product 3 should be in the list.' );
	}
}
