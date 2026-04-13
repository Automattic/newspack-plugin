<?php
/**
 * Provisions Newspack's standard GA4 custom dimensions on the publisher's
 * connected GA4 property.
 *
 * Delegates API calls to Site Kit's authenticated client via
 * GoogleSiteKitAnalytics, so the call is made against Site Kit's Google Cloud
 * project (which already has analyticsadmin.googleapis.com enabled) and uses
 * Site Kit's stored credentials.
 *
 * @package Newspack
 */

namespace Newspack;

use Google\Site_Kit\Context;

defined( 'ABSPATH' ) || exit;

/**
 * GA4 custom dimensions provisioning.
 */
final class GA4_Custom_Dimensions {

	const PROVISIONED_OPTION = 'newspack_ga4_dimensions_provisioned';
	const LOGGER_HEADER      = 'NEWSPACK-GA4-DIMENSIONS';
	const PROVISION_ACTION   = 'newspack_ga4_provision_dimensions';

	/**
	 * Register hooks.
	 */
	public static function init() {
		// Re-run provisioning when Site Kit's GA4 property ID is first set or changes.
		add_action( 'add_option_googlesitekit_analytics-4_settings', [ __CLASS__, 'on_sitekit_settings_added' ], 10, 2 );
		add_action( 'update_option_googlesitekit_analytics-4_settings', [ __CLASS__, 'on_sitekit_settings_updated' ], 10, 2 );
		add_action( self::PROVISION_ACTION, [ __CLASS__, 'provision' ] );
	}

	/**
	 * Fired when Site Kit's analytics-4 option is first added. Schedules
	 * provisioning if the new settings include a property ID.
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  New option value.
	 */
	public static function on_sitekit_settings_added( $option, $value ) {
		if ( ! empty( $value['propertyID'] ) ) {
			self::schedule_provisioning( (string) $value['propertyID'] );
		}
	}

	/**
	 * Fired when Site Kit's analytics-4 option is updated. Schedules
	 * provisioning if the property ID has just been set or has changed.
	 *
	 * @param mixed $old_value Previous option value.
	 * @param mixed $new_value New option value.
	 */
	public static function on_sitekit_settings_updated( $old_value, $new_value ) {
		$new_property_id = is_array( $new_value ) && ! empty( $new_value['propertyID'] ) ? (string) $new_value['propertyID'] : '';
		$old_property_id = is_array( $old_value ) && ! empty( $old_value['propertyID'] ) ? (string) $old_value['propertyID'] : '';
		if ( '' === $new_property_id ) {
			return;
		}
		if ( $old_property_id === $new_property_id ) {
			return;
		}
		self::schedule_provisioning( $new_property_id );
	}

	/**
	 * Schedule an immediate single-shot WP-Cron event to run provisioning in
	 * the background. Skips if the property has already been provisioned.
	 *
	 * @param string $property_id The GA4 property ID that will be provisioned.
	 */
	private static function schedule_provisioning( $property_id ) {
		$provisioned = get_option( self::PROVISIONED_OPTION, [] );
		if (
			is_array( $provisioned )
			&& isset( $provisioned['property_id'] )
			&& (string) $provisioned['property_id'] === $property_id
		) {
			return;
		}
		if ( wp_next_scheduled( self::PROVISION_ACTION ) ) {
			return;
		}
		wp_schedule_single_event( time() + 10, self::PROVISION_ACTION );
		Logger::log( "Scheduled GA4 dimension provisioning for property $property_id.", self::LOGGER_HEADER );
	}

	/**
	 * Priority-ordered list of custom dimensions Newspack provisions.
	 * Each entry: parameter name => display name.
	 */
	public static function get_dimensions() {
		return [
			'gate_post_id'                => 'Gate Post ID',
			'is_reader'                   => 'Is Reader',
			'action_type'                 => 'Action Type',
			'action'                      => 'Action',
			'logged_in'                   => 'Logged In',
			'is_subscriber'               => 'Is Subscriber',
			'is_donor'                    => 'Is Donor',
			'is_newsletter_subscriber'    => 'Is Newsletter Subscriber',
			'newspack_popup_id'           => 'Newspack Popup ID',
			'prompt_placement'            => 'Prompt Placement',
			'prompt_frequency'            => 'Prompt Frequency',
			'prompt_title'                => 'Prompt Title',
			'gate_has_donation_block'     => 'Gate Has Donation Block',
			'gate_has_registration_block' => 'Gate Has Registration Block',
			'gate_has_checkout_button'    => 'Gate Has Checkout Button',
			'gate_has_registration_link'  => 'Gate Has Registration Link',
			'gate_has_signin_link'        => 'Gate Has Signin Link',
			'product_id'                  => 'Product ID',
			'product_type'                => 'Product Type',
			'recurrence'                  => 'Recurrence',
			'price'                       => 'Price',
			'donation_frequency'          => 'Donation Frequency',
			'donation_amount'             => 'Donation Amount',
			'registration_method'         => 'Registration Method',
			'lists'                       => 'Newsletter Lists',
			'categories'                  => 'Categories',
			'author'                      => 'Author',
		];
	}

	/**
	 * Read the connected GA4 property ID from Site Kit's stored settings.
	 *
	 * @return string|false
	 */
	private static function get_property_id() {
		$settings = get_option( 'googlesitekit_analytics-4_settings', [] );
		if ( empty( $settings['propertyID'] ) ) {
			return false;
		}
		return (string) $settings['propertyID'];
	}

	/**
	 * Instantiate Newspack's Site Kit Analytics module wrapper, ensuring an
	 * authenticated user context so Site Kit's client can resolve OAuth
	 * tokens from user meta.
	 *
	 * Site Kit stores tokens keyed on user ID (User_Options). In WP-Cron,
	 * WP-CLI, or anywhere without a logged-in user, `get_current_user_id()`
	 * returns 0 and Site Kit can't find credentials. We fall back to the
	 * Analytics module owner stored in Site Kit's own settings.
	 *
	 * @return GoogleSiteKitAnalytics|\WP_Error
	 */
	private static function get_analytics_module() {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return new \WP_Error( 'newspack_ga4_dimensions', 'Google Site Kit is not active.' );
		}
		if ( ! class_exists( __NAMESPACE__ . '\\GoogleSiteKitAnalytics' ) ) {
			return new \WP_Error( 'newspack_ga4_dimensions', 'GoogleSiteKitAnalytics class not available.' );
		}
		if ( ! get_current_user_id() ) {
			$settings = get_option( 'googlesitekit_analytics-4_settings', [] );
			$owner_id = isset( $settings['ownerID'] ) ? (int) $settings['ownerID'] : 0;
			if ( $owner_id > 0 ) {
				wp_set_current_user( $owner_id );
			} else {
				return new \WP_Error( 'newspack_ga4_dimensions', 'No Site Kit module owner found to authenticate as.' );
			}
		}
		return new GoogleSiteKitAnalytics( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * Report the current state without making any changes: whether Site Kit
	 * and its GA4 property are connected, whether we can list the property's
	 * existing dimensions, and how many slots remain out of the 50-dim cap.
	 *
	 * @return array|\WP_Error
	 */
	public static function status() {
		$property_id = self::get_property_id();
		if ( ! $property_id ) {
			return new \WP_Error( 'newspack_ga4_dimensions', 'No GA4 property ID configured in Site Kit.' );
		}
		$module = self::get_analytics_module();
		if ( is_wp_error( $module ) ) {
			return $module;
		}
		try {
			$existing = $module->list_custom_dimensions( $property_id );
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'newspack_ga4_dimensions', 'Failed listing custom dimensions: ' . $e->getMessage() );
		}

		$event_scoped = [];
		foreach ( $existing as $dimension ) {
			if ( isset( $dimension['scope'] ) && 'EVENT' === $dimension['scope'] ) {
				$event_scoped[] = $dimension['parameterName'];
			}
		}

		$desired          = array_keys( self::get_dimensions() );
		$existing_params  = array_column( $existing, 'parameterName' );
		$missing          = array_values( array_diff( $desired, $existing_params ) );
		$already_present  = array_values( array_intersect( $desired, $existing_params ) );

		return [
			'property_id'           => $property_id,
			'site_kit_connected'    => true,
			'event_scoped_existing' => count( $event_scoped ),
			'newspack_total'        => count( $desired ),
			'newspack_present'      => $already_present,
			'newspack_missing'      => $missing,
			'provisioned_option'    => get_option( self::PROVISIONED_OPTION, null ),
		];
	}

	/**
	 * Provision Newspack's standard GA4 custom dimensions.
	 *
	 * Idempotent: existing dimensions are detected and skipped. Creates
	 * missing dimensions in priority order, stopping if the property's 50
	 * event-scoped dimension limit would be exceeded.
	 *
	 * @return array|\WP_Error Summary of what was created and skipped, or error.
	 */
	public static function provision() {
		$property_id = self::get_property_id();
		if ( ! $property_id ) {
			Logger::log( 'No GA4 property ID found; skipping custom dimension provisioning.', self::LOGGER_HEADER );
			return new \WP_Error( 'newspack_ga4_dimensions', 'No GA4 property ID configured.' );
		}

		$module = self::get_analytics_module();
		if ( is_wp_error( $module ) ) {
			Logger::log( 'Skipping provisioning: ' . $module->get_error_message(), self::LOGGER_HEADER );
			return $module;
		}

		try {
			$existing = $module->list_custom_dimensions( $property_id );
		} catch ( \Throwable $e ) {
			Logger::log( 'Failed listing GA4 custom dimensions: ' . $e->getMessage(), self::LOGGER_HEADER );
			return new \WP_Error( 'newspack_ga4_dimensions', 'Failed listing custom dimensions: ' . $e->getMessage() );
		}

		$existing_params = [];
		foreach ( $existing as $dimension ) {
			if ( isset( $dimension['parameterName'] ) ) {
				$existing_params[ $dimension['parameterName'] ] = true;
			}
		}

		$created        = [];
		$skipped_exists = [];
		$errors         = [];

		foreach ( self::get_dimensions() as $parameter_name => $display_name ) {
			if ( isset( $existing_params[ $parameter_name ] ) ) {
				$skipped_exists[] = $parameter_name;
				continue;
			}
			try {
				$module->create_custom_dimension( $property_id, $parameter_name, $display_name );
				$created[] = $parameter_name;
				Logger::log( "Created GA4 dimension '$parameter_name' on property $property_id.", self::LOGGER_HEADER );
			} catch ( \Throwable $e ) {
				$errors[ $parameter_name ] = $e->getMessage();
				Logger::log( "Failed to create GA4 dimension '$parameter_name': " . $e->getMessage(), self::LOGGER_HEADER );
			}
		}

		$summary = [
			'property_id'    => $property_id,
			'timestamp'      => time(),
			'created'        => $created,
			'skipped_exists' => $skipped_exists,
			'errors'         => $errors,
		];

		$previous = get_option( self::PROVISIONED_OPTION, [] );
		if ( is_array( $previous ) && isset( $previous['created'] ) && is_array( $previous['created'] ) ) {
			$summary['created'] = array_values( array_unique( array_merge( $previous['created'], $created ) ) );
		}

		update_option( self::PROVISIONED_OPTION, $summary );

		Logger::log(
			sprintf(
				'GA4 dimension provisioning complete for property %s. Created: %d, existed: %d, errors: %d',
				$property_id,
				count( $created ),
				count( $skipped_exists ),
				count( $errors )
			),
			self::LOGGER_HEADER
		);

		return $summary;
	}
}
GA4_Custom_Dimensions::init();
