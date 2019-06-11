<?php
/**
 * Newspack Wizards manager.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the wizards.
 */
class Wizards {

	/**
	 * Information about all of the wizards.
	 * See `init` for structure of the data.
	 *
	 * @var array
	 */
	protected static $wizards = [];

	/**
	 * Initialize and register all of the wizards.
	 */
	public static function init() {
		self::$wizards = [
			'dashboard'                => new Dashboard(),
			'subscriptions-onboarding' => new Subscriptions_Onboarding_Wizard(),
			'subscriptions'            => new Subscriptions_Wizard(),
			'components-demo'          => new Components_Demo(),
		];
	}

	/**
	 * Get a wizard's object.
	 *
	 * @param string $wizard_slug The wizard to get. Use slug from self::$wizards.
	 * @return Wizard | bool The wizard on success, false on failure.
	 */
	public static function get_wizard( $wizard_slug ) {
		if ( isset( self::$wizards[ $wizard_slug ] ) ) {
			return self::$wizards[ $wizard_slug ];
		}

		return false;
	}

	/**
	 * Get a wizard's URL.
	 *
	 * @param string $wizard_slug The wizard to get URL for. Use slug from self::$wizards.
	 * @return string | bool The URL on success, false on failure.
	 */
	public static function get_url( $wizard_slug ) {
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return $wizard->get_url();
		}

		return false;
	}

	/**
	 * Get a wizard's name.
	 *
	 * @param string $wizard_slug The wizard to get name for. Use slug from self::$wizards.
	 * @return string | bool The name on success, false on failure.
	 */
	public static function get_name( $wizard_slug ) {
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return $wizard->get_name();
		}

		return false;
	}

	/**
	 * Get a wizard's description.
	 *
	 * @param string $wizard_slug The wizard to get description for. Use slug from self::$wizards.
	 * @return string | bool The description on success, false on failure.
	 */
	public static function get_description( $wizard_slug ) {
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return $wizard->get_description();
		}

		return false;
	}
}
Wizards::init();
