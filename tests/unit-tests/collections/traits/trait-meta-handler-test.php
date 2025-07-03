<?php
/**
 * Trait with common test helper methods for meta handler testing.
 *
 * @package Newspack\Tests\Unit\Collections
 *
 * phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid, WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase, WordPress.PHP.StaticAccess.NotRecommended
 */

namespace Newspack\Tests\Unit\Collections\Traits;

/**
 * Trait providing common test helper methods for meta handler testing.
 *
 * This trait provides reusable methods for testing meta field registration
 * and validation in classes that use the Meta_Handler trait. It helps reduce
 * code duplication and makes tests more maintainable.
 */
trait Trait_Meta_Handler_Test {

	/**
	 * Assert that meta fields are registered correctly for a given class.
	 *
	 * This method tests that all meta definitions from a class using the Meta_Handler
	 * trait are properly registered with WordPress and have the correct properties.
	 *
	 * @param string $class_name The class name that uses the Meta_Handler trait.
	 * @param string $object_type The object type ('post' or 'term').
	 * @param string $object_subtype The object subtype (post type or taxonomy name).
	 * @param string $message Optional. Message to display on failure.
	 */
	protected function assertMetaFieldsRegistered( $class_name, $object_type, $object_subtype, $message = '' ) {
		// Get registered meta keys for the object type and subtype.
		$registered_meta = get_registered_meta_keys( $object_type, $object_subtype );

		// Get meta definitions from the class.
		$meta_definitions = $class_name::get_meta_definitions();

		// Test that our meta keys are registered and have the correct values.
		foreach ( $meta_definitions as $key => $meta ) {
			$meta_key = $class_name::$prefix . $key;

			// Assert that the meta key is registered.
			$this->assertArrayHasKey(
				$meta_key,
				$registered_meta,
				$message ? $message : sprintf( 'Meta key "%s" is not registered', $meta_key )
			);

			// Assert that each property of the meta definition matches the registered meta.
			foreach ( $meta as $property => $value ) {
				$this->assertEquals(
					$value,
					$registered_meta[ $meta_key ][ $property ],
					$message ? $message : sprintf(
						'Meta key "%s" has incorrect value for property "%s"',
						$meta_key,
						$property
					)
				);
			}

			// Assert that the auth_callback is set correctly.
			$this->assertEquals(
				[ $class_name, 'auth_callback' ],
				$registered_meta[ $meta_key ]['auth_callback'],
				$message ? $message : sprintf( 'Meta key "%s" should have correct auth_callback', $meta_key )
			);

			// Assert that the object_subtype is set correctly.
			$this->assertEquals(
				$object_subtype,
				$registered_meta[ $meta_key ]['object_subtype'],
				$message ? $message : sprintf( 'Meta key "%s" should have correct object_subtype', $meta_key )
			);
		}
	}

	/**
	 * Assert that meta fields are NOT registered for a given class.
	 *
	 * This method tests that meta fields from a class are NOT registered,
	 * which can be useful for testing cleanup or unregistration scenarios.
	 *
	 * @param string $class_name The class name that uses the Meta_Handler trait.
	 * @param string $object_type The object type ('post' or 'term').
	 * @param string $object_subtype The object subtype (post type or taxonomy name).
	 * @param string $message Optional. Message to display on failure.
	 */
	protected function assertMetaFieldsNotRegistered( $class_name, $object_type, $object_subtype, $message = '' ) {
		// Get registered meta keys for the object type and subtype.
		$registered_meta = get_registered_meta_keys( $object_type, $object_subtype );

		// Get meta definitions from the class.
		$meta_definitions = $class_name::get_meta_definitions();

		// Test that none of our meta keys are registered.
		foreach ( $meta_definitions as $key => $meta ) {
			$meta_key = $class_name::$prefix . $key;

			$this->assertArrayNotHasKey(
				$meta_key,
				$registered_meta,
				$message ? $message : sprintf( 'Meta key "%s" should not be registered', $meta_key )
			);
		}
	}

	/**
	 * Assert that frontend meta definitions are correctly formatted.
	 *
	 * This method tests that the get_frontend_meta_definitions() method
	 * returns properly formatted data for frontend consumption.
	 *
	 * @param string $class_name The class name that uses the Meta_Handler trait.
	 * @param string $message Optional. Message to display on failure.
	 */
	protected function assertFrontendMetaDefinitionsValid( $class_name, $message = '' ) {
		$frontend_definitions = $class_name::get_frontend_meta_definitions();
		$meta_definitions     = $class_name::get_meta_definitions();

		// Assert that we have the same number of definitions.
		$this->assertCount(
			count( $meta_definitions ),
			$frontend_definitions,
			$message ? $message : 'Frontend definitions should have the same count as meta definitions'
		);

		// Test each frontend definition.
		foreach ( $frontend_definitions as $key => $frontend_meta ) {
			// Assert that the key exists in the original definitions.
			$this->assertArrayHasKey(
				$key,
				$meta_definitions,
				$message ? $message : sprintf( 'Frontend key "%s" should exist in meta definitions', $key )
			);

			// Assert that required frontend properties are present.
			$this->assertArrayHasKey(
				'key',
				$frontend_meta,
				$message ? $message : sprintf( 'Frontend meta for "%s" should have a "key" property', $key )
			);

			$this->assertArrayHasKey(
				'type',
				$frontend_meta,
				$message ? $message : sprintf( 'Frontend meta for "%s" should have a "type" property', $key )
			);

			// Assert that the key is properly prefixed.
			$this->assertEquals(
				$class_name::$prefix . $key,
				$frontend_meta['key'],
				$message ? $message : sprintf( 'Frontend meta key for "%s" should be properly prefixed', $key )
			);

			// Assert that the type is valid.
			$valid_types = [ 'text', 'url', 'array', 'boolean', 'integer' ];
			$this->assertContains(
				$frontend_meta['type'],
				$valid_types,
				$message ? $message : sprintf( 'Frontend meta type for "%s" should be valid', $key )
			);
		}
	}

	/**
	 * Assert that meta values can be set and retrieved correctly.
	 *
	 * This method tests the get() method of the Meta_Handler trait
	 * by setting a meta value and then retrieving it.
	 *
	 * @param string $class_name The class name that uses the Meta_Handler trait.
	 * @param int    $object_id The ID of the object (post or term).
	 * @param string $meta_key The meta key to test (without prefix).
	 * @param mixed  $test_value The value to test with.
	 * @param string $message Optional. Message to display on failure.
	 */
	protected function assertMetaValueCanBeSetAndRetrieved( $class_name, $object_id, $meta_key, $test_value, $message = '' ) {
		// Set the meta value.
		$full_meta_key = $class_name::$prefix . $meta_key;
		update_metadata( 'post', $object_id, $full_meta_key, $test_value );

		// Retrieve the meta value using the class method.
		$retrieved_value = $class_name::get( $object_id, $meta_key );

		// Assert that the retrieved value matches the set value.
		$this->assertEquals(
			$test_value,
			$retrieved_value,
			$message ? $message : sprintf( 'Meta value for key "%s" should be retrieved correctly', $meta_key )
		);
	}
}
