<?php
/**
 * Incoming Contact Field class
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Integrations;

defined( 'ABSPATH' ) || exit;

/**
 * Incoming Contact Field Class.
 *
 * Represents a contact field from an external integration.
 */
class Incoming_Contact_Field {
	/**
	 * The key for this field.
	 *
	 * @var string
	 */
	protected $key;

	/**
	 * Constructor.
	 *
	 * @param string $key The key for this field.
	 */
	public function __construct( $key ) {
		$this->key = $key;
	}

	/**
	 * Get the field key.
	 *
	 * @return string The field key.
	 */
	public function get_key() {
		return $this->key;
	}
}
