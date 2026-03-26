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
	 * Configuration for this field.
	 *
	 * @var array
	 */
	protected $config = [];

	/**
	 * Constructor.
	 *
	 * @param string $key    The key for this field.
	 * @param array  $config Optional. Promotion configuration with keys:
	 *                       - name                (string) Human-readable label.
	 *                       - is_access_rule      (bool)   Register as a content gate access rule.
	 *                       - is_segment_criteria (bool)   Register as a popups segmentation criterion.
	 *                       - value_type          (string) Value type: 'boolean', 'string' (default).
	 *                       - matching_function   (string) One of 'default', 'range', 'list__in', 'list__not_in'.
	 *                       - options             (array)  Array of [ 'value' => ..., 'label' => ... ] options.
	 *                       - description         (string) Help text for the UI.
	 */
	public function __construct( $key, $config = [] ) {
		$this->key    = $key;
		$this->config = $config;
	}

	/**
	 * Get the field key.
	 *
	 * @return string The field key.
	 */
	public function get_key() {
		return $this->key;
	}

	/**
	 * Get the promotion configuration.
	 *
	 * @return array The promotion config, or empty array if not promoted.
	 */
	public function get_config() {
		return $this->config;
	}

	/**
	 * Whether this field is promoted as an access rule or segmentation criterion.
	 *
	 * @return bool
	 */
	public function is_promoted() {
		return ! empty( $this->config )
			&& ( ! empty( $this->config['is_access_rule'] ) || ! empty( $this->config['is_segment_criteria'] ) );
	}

	/**
	 * Get the human-readable name, falling back to the key.
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->config['name'] ?? $this->key;
	}

	/**
	 * Get the value type.
	 *
	 * @return string
	 */
	public function get_value_type() {
		return $this->config['value_type'] ?? 'string';
	}
}
