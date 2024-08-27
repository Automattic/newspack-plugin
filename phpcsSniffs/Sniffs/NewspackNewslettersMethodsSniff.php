<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Newspack Newsletters Methods Sniff
 *
 * @package newspack-newsletters
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

/**
 * Sniff for catching classes not marked as abstract or final
 */
class NewspackNewslettersMethodsSniff implements PHP_CodeSniffer_Sniff {

	/**
	 * The error code.
	 */
	const ERROR_CODE = 'ForbiddenContactsMethods';

	/**
	 * The error message.
	 */
	const ERROR_MESSAGE = 'Method %s is reserved for internal use and should not be called from this scope. Use methods in Newspack_Newsletters_Contacts class instead to manipulate contacts.';

	/**
	 * The Warning code.
	 */
	const WARNING_CODE = 'PossibleForbiddenContactsMethods';

	/**
	 * The Warning message.
	 */
	const WARNING_MESSAGE = 'Possible forbidden Newsletters method detected. Method %s from the email provider classes is reserved for internal use and should not be called from this scope. Use methods in Newspack_Newsletters_Contacts class instead to manipulate contacts.';

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return array(int)
	 */
	public function register() {
		return array( T_STRING );
	}

	/**
	 * The methods we are looking for.
	 *
	 * These methods can only be called from the allowed classes or the service provider directory.
	 *
	 * @var array
	 */
	private $methods = [
		'add_contact',
		'add_esp_local_list_to_contact',
		'remove_esp_local_list_from_contact',
		'add_tag_to_contact',
		'remove_tag_from_contact',
		'update_contact_local_lists',
		'update_contact_lists_handling_local',
		'add_contact_handling_local_list',
		'add_contact_with_groups_and_tags',
		'update_contact_lists',
		'add_contact',
		'delete_user_subscription',
		'update_contact_lists',
	];

	/**
	 * The classes where forbidden static methods live.
	 *
	 * @var array
	 */
	private $static_classes = [
		'Newspack_Newsletters_Subscription',
	];

	/**
	 * The current class name.
	 *
	 * @var string
	 */
	private $current_class = '';

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * Will look for calls of the methods defined in $this->methods and check if they are called from the allowed classes.
	 * They are also allowed to be called from within the service-providers directory.
	 *
	 * @param PHP_CodeSniffer_File $phpcs_file The file where the token was found.
	 * @param int                  $stack_ptr The position in the stack where the token was found.
	 */
	public function process( PHP_CodeSniffer_File $phpcs_file, $stack_ptr ) {

		$tokens = $phpcs_file->getTokens();
		$token = $tokens[ $stack_ptr ];

		if ( in_array( $token['content'], $this->methods, true ) ) {
			$operator = $tokens[ $stack_ptr - 1 ];

			if ( $operator['type'] === 'T_DOUBLE_COLON' ) {

				$class_name = $tokens[ $stack_ptr - 2 ]['content'];
				if ( in_array( $class_name, $this->static_classes, true ) ) {

					$method_name = $class_name . '::' . $token['content'] . '()';

					$phpcs_file->addError(
						sprintf( self::ERROR_MESSAGE, $method_name ),
						$stack_ptr,
						self::ERROR_CODE
					);
				}
			} elseif ( $operator['type'] === 'T_OBJECT_OPERATOR' ) {

				$method_name = $token['content'];

				$phpcs_file->addWarning(
					sprintf( self::WARNING_MESSAGE, $method_name ),
					$stack_ptr,
					self::WARNING_CODE
				);
			}
		}
	}
}
