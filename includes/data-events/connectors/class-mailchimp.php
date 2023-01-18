<?php
/**
 * Newspack Data Events Mailchimp Connector
 *
 * @package Newspack
 */

namespace Newspack\Data_Events\Connectors;

use \Newspack\Data_Events;
use \Newspack\Mailchimp_API;
use \Newspack\Newspack_Newsletters;
use \Newspack\Reader_Activation;
use \Newspack\WooCommerce_Connection;

defined( 'ABSPATH' ) || exit;

/**
 * Main Class.
 */
class Mailchimp {
	/**
	 * Constructor.
	 */
	public function __construct() {
		Data_Events::register_handler( [ __CLASS__, 'reader_registered' ], 'reader_registered' );
		Data_Events::register_handler( [ __CLASS__, 'donation_new' ], 'donation_new' );
	}

	/**
	 * Get audience ID.
	 *
	 * @return string|bool Audience ID or false if not set.
	 */
	private static function get_audience_id() {
		/** TODO: UI for handling Mailchimp's master list in RAS. */
		if ( Reader_Activation::is_enabled() ) {
			$audience_id = Reader_Activation::get_setting( 'mailchimp_audience_id' );
		}
		/** Attempt to use list ID from "Mailchimp for WooCommerce" */
		if ( ! $audience_id && function_exists( 'mailchimp_get_list_id' ) ) {
			$audience_id = mailchimp_get_list_id();
		}
		return ! empty( $audience_id ) ? $audience_id : false;
	}

	/**
	 * Get merge field type.
	 *
	 * @param mixed $value Value to check.
	 *
	 * @return string Merge field type.
	 */
	private static function get_merge_field_type( $value ) {
		if ( is_numeric( $value ) ) {
			return 'number';
		}
		if ( is_bool( $value ) ) {
			return 'boolean';
		}
		return 'text';
	}

	/**
	 * Update a Mailchimp contact
	 *
	 * @param string $email Email address.
	 * @param array  $data  Data to update.
	 */
	private static function put( $email, $data = [] ) {
		$audience_id = self::get_audience_id();
		if ( ! $audience_id ) {
			return;
		}
		$hash    = md5( strtolower( $email ) );
		$payload = [
			'email_address' => $email,
			'status_if_new' => 'transactional',
		];
		if ( ! empty( $data ) ) {
			$merge_fields    = [];
			$fields_ids      = \get_option( 'newspack_data_mailchimp_fields', [] );
			$existing_fields = Mailchimp_API::get( "lists/$audience_id/merge-fields?count=1000" );
			foreach ( $existing_fields['merge_fields'] as $field ) {
				$field_name = '';
				if ( isset( $fields_ids[ $field['merge_id'] ] ) ) {
					// Match locally stored merge field ID.
					$field_name = $fields_ids[ $field['merge_id'] ];
				} elseif ( isset( $data[ $field['name'] ] ) ) {
					// Match by merge field name.
					$field_name                       = $field['name'];
					$fields_ids[ $field['merge_id'] ] = $field_name;
				}
				// If field name is found, add it to the payload.
				if ( ! empty( $field_name ) ) {
					$merge_fields[ $field['tag'] ] = $data[ $field_name ];
					unset( $data[ $field['name'] ] );
				}
			}
			// Create remaining fields.
			$remaining_fields = array_keys( $data );
			foreach ( $remaining_fields as $field_name ) {
				$created_field                            = Mailchimp_API::post(
					"lists/$audience_id/merge-fields",
					[
						'name' => $field_name,
						'type' => self::get_merge_field_type( $data[ $field_name ] ),
					]
				);
				$merge_fields[ $created_field['tag'] ]    = $data[ $field_name ];
				$fields_ids[ $created_field['merge_id'] ] = $field_name;
			}
			if ( ! empty( $merge_fields ) ) {
				$payload['merge_fields'] = $merge_fields;
			}
			\update_option( 'newspack_data_mailchimp_fields', $fields_ids );
		}
		Mailchimp_API::put(
			"lists/$audience_id/members/$hash",
			$payload
		);
	}

	/**
	 * Handle a reader registering.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function reader_registered( $timestamp, $data, $client_id ) {
		self::put( $data['email'], $data['metadata'] );
	}

	/**
	 * Handle a donation being made.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function donation_new( $timestamp, $data, $client_id ) {
		if ( ! isset( $data['platform_data']['order_id'] ) ) {
			return;
		}

		$order_id = $data['platform_data']['order_id'];
		$contact  = WooCommerce_Connection::get_contact_from_order( $order_id );

		// We don't want to overwrite the registration method.
		unset( $contact['metadata']['registration_method'] );

		self::put( $contact['email'], $contact['metadata'] );
	}
}
new Mailchimp();
