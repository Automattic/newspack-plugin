<?php
/**
 * Example integration for testing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Integrations;

use Newspack\Reader_Activation\Sync\Integration;

defined( 'ABSPATH' ) || exit;

/**
 * Example Integration Class.
 *
 * This is a dummy integration for demonstration purposes.
 */
class Example_Integration extends Integration {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$settings_fields = [
			[
				'key'         => 'api_key',
				'description' => __( 'API Key', 'newspack-plugin' ),
				'type'        => 'text',
				'placeholder' => __( 'Enter your API key', 'newspack-plugin' ),
				'help'        => __( 'Find your API key in your account settings', 'newspack-plugin' ),
				'helpURL'     => 'https://example.com/docs/api-key',
			],
			[
				'key'         => 'api_secret',
				'description' => __( 'API Secret', 'newspack-plugin' ),
				'type'        => 'password',
				'placeholder' => __( 'Enter your API secret', 'newspack-plugin' ),
			],
			[
				'key'         => 'endpoint_url',
				'description' => __( 'API Endpoint URL', 'newspack-plugin' ),
				'type'        => 'text',
				'default'     => 'https://api.example.com',
				'placeholder' => 'https://api.example.com',
			],
			[
				'key'         => 'enable_logging',
				'description' => __( 'Enable Debug Logging', 'newspack-plugin' ),
				'type'        => 'checkbox',
				'default'     => false,
			],
		];

		parent::__construct( 'example_integration', __( 'Example Integration', 'newspack-plugin' ), $settings_fields );
	}

	/**
	 * Fetch contact data from the integration source.
	 *
	 * @param mixed $source The source to retrieve contact data from.
	 *
	 * @return array|\WP_Error Array of contact data or WP_Error on failure.
	 */
	public function fetch_contact_data( $source ) {
		// This is a dummy implementation.
		return [
			'email'    => 'user@example.com',
			'name'     => 'John Doe',
			'metadata' => [],
		];
	}

	/**
	 * Push contact data to the integration destination.
	 *
	 * @param array  $contact The contact data to push.
	 * @param string $context Optional. The context of the sync.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	public function push_contact_data( $contact, $context = '' ) {
		// This is a dummy implementation.
		return true;
	}

	/**
	 * Get metadata keys for this integration.
	 *
	 * This returns the stored metadata keys from the database.
	 *
	 * @return array Array of metadata keys.
	 */
	public function get_metadata_keys() {
		return parent::get_metadata_keys();
	}
}
