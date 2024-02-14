<?php
/**
 * Newspack ESP Sync Schema for Mailchimp
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack_Newsletters as Newspack_Newsletters_Plugin;

defined( 'ABSPATH' ) || exit;

/**
 * A minimalist schema that uses as little merge fields as possible and syncs only the essential data
 *
 * Designed to be used with Newspack Network plugin, for network of sites connected to the same Mailchimp account, in which there is a limit of merge fields we can use
 */
class Mailchimp_Minimum {

	/**
	 * Initialize the class and maybe activate the schema
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! class_exists( 'Newspack_Newsletters' ) ) {
			return;
		}
		if ( 'mailchimp' !== Newspack_Newsletters_Plugin::service_provider() ) {
			return;
		}
		if ( defined( 'NEWSPACK_ESP_SYNC_SCHEMA' ) && NEWSPACK_ESP_SYNC_SCHEMA === 'mailchimp_minimum' ) {
			add_filter( 'newspack_esp_sync_normalize_contact', [ __CLASS__, 'normalize_contact_data' ] );
		}
	}

	/**
	 * Add a the chosen prefix for synced metadata fields
	 *
	 * @param string $string The string to be prefixed.
	 * @param string $second_prefix A second prefix to be added.
	 * @return string
	 */
	public static function prefix( $string, $second_prefix = '' ) {
		return Newspack_Newsletters::get_metadata_prefix() . $second_prefix . $string;
	}

	/**
	 * Get all possible product tags on this site
	 *
	 * @return string[]
	 */
	public static function get_all_products_tags() {
		$tags = [];
		$products = get_posts(
			[
				'post_type'      => 'product',
				'posts_per_page' => -1,
			]
		);
		foreach ( $products as $product ) {
			$tags[] = self::prefix( $product->post_title, 'Product_' );
		}
		return $tags;
	}

	/**
	 * Normalizes the contact with the minimum amount of data needed for Mailchimp
	 *
	 * @param array $contact The contact data after it has been normalized by Newspack_Newsletters class.
	 * @return array
	 */
	public static function normalize_contact_data( $contact ) {
		$new_metadata = [];
		$new_metadata['First Name'] = $contact['metadata']['First Name'];
		$new_metadata['Last Name'] = $contact['metadata']['Last Name'];
		$new_metadata[ Newspack_Newsletters::get_metadata_key( 'sub_end_date' ) ] = $contact['metadata'][ Newspack_Newsletters::get_metadata_key( 'sub_end_date' ) ];

		$tags_to_add = [];
		$tags_to_remove = [];

		if ( ! empty( $contact['metadata'][ Newspack_Newsletters::get_metadata_key( 'product_name' ) ] ) ) {
			$product_tag = self::prefix( $contact['metadata'][ Newspack_Newsletters::get_metadata_key( 'product_name' ) ], 'Product_' );
			$product_tags_to_remove = array_filter(
				self::get_all_products_tags(),
				function( $tag ) use ( $product_tag ) {
					return $tag !== $product_tag;
				}
			);
		}

		$membership_status = $contact['metadata'][ Newspack_Newsletters::get_metadata_key( 'membership_status' ) ] ?? '';
		$membership_status_tags = self::get_membership_status_tags( $membership_status );

		$tags_to_add = array_merge( $membership_status_tags['add'], [ $product_tag ] );
		$tags_to_remove = array_merge( $product_tags_to_remove, $membership_status_tags['remove'] );

		$contact['metadata'] = $new_metadata;
		$contact['tags_to_add'] = $tags_to_add;
		$contact['tags_to_remove'] = $tags_to_remove;

		return $contact;
	}

	/**
	 * Get the tags to add and remove based on the membership status
	 *
	 * @param string $membership_status The current membership status value.
	 * @return array An array with a "add" and "remove" keys, which of them with an array of tags to add and remove, respectively.
	 */
	public static function get_membership_status_tags( $membership_status ) {
		if ( empty( $membership_status ) ) {
			return [
				'add'    => [],
				'remove' => [],
			];
		}
		if ( strstartswith( $membership_status, 'Ex-' ) ) {
			return [
				'add'    => [ self::prefix( 'Paid_Status_Expired' ) ],
				'remove' => [ self::prefix( 'Paid_Status_Active' ) ],
			];
		}
		return [
			'add'    => [ self::prefix( 'Paid_Status_Active' ) ],
			'remove' => [ self::prefix( 'Paid_Status_Expired' ) ],
		];
	}
}

Mailchimp_Minimum::init();
