<?php
/**
 * Reader Activation related emails.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Activation related emails.
 */
class Reader_Activation_Emails {
	const EMAIL_TYPES = [
		'VERIFICATION'   => 'reader-activation-verification',
		'MAGIC_LINK'     => 'reader-activation-magic-link',
		'DELETE_ACCOUNT' => 'reader-activation-delete-account',
	];

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		add_filter( 'newspack_email_configs', [ __CLASS__, 'add_email_configs' ] );
	}

	/**
	 * Register email type.
	 *
	 * @param array $configs Email types.
	 */
	public static function add_email_configs( $configs ) {
		$configs[ self::EMAIL_TYPES['VERIFICATION'] ]   = [
			'name'                   => self::EMAIL_TYPES['VERIFICATION'],
			'label'                  => __( 'Verification', 'newspack' ),
			'description'            => __( "Email sent to the reader after they've registered.", 'newspack' ),
			'template'               => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-activation-emails/verification.php',
			'editor_notice'          => __( 'This email will be sent to a reader after they\'ve registered.', 'newspack' ),
			'available_placeholders' => [
				[
					'label'    => __( 'the verification link', 'newspack' ),
					'template' => '*VERIFICATION_URL*',
				],
			],
		];
		$configs[ self::EMAIL_TYPES['MAGIC_LINK'] ]     = [
			'name'                   => self::EMAIL_TYPES['MAGIC_LINK'],
			'label'                  => __( 'Login link', 'newspack' ),
			'description'            => __( 'Email with a login link.', 'newspack' ),
			'template'               => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-activation-emails/magic-link.php',
			'editor_notice'          => __( 'This email will be sent to a reader when they request a login link.', 'newspack' ),
			'available_placeholders' => [
				[
					'label'    => __( 'the login link', 'newspack' ),
					'template' => '*MAGIC_LINK_URL*',
				],
			],
		];
		$configs[ self::EMAIL_TYPES['DELETE_ACCOUNT'] ] = [
			'name'                   => self::EMAIL_TYPES['DELETE_ACCOUNT'],
			'label'                  => __( 'Delete Account', 'newspack' ),
			'description'            => __( 'Email with account deletion link.', 'newspack' ),
			'template'               => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-activation-emails/delete-account.php',
			'editor_notice'          => __( 'This email will be sent to a reader when they request an account deletion.', 'newspack' ),
			'available_placeholders' => [
				[
					'label'    => __( 'the account deletion link', 'newspack' ),
					'template' => '*DELETION_LINK*',
				],
			],
		];
		return $configs;
	}
}
Reader_Activation_Emails::init();
