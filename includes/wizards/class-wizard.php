<?php
/**
 * Common functionality for admin wizards.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Common functionality for admin wizards. Override this class.
 */
abstract class Wizard {

	/**
	 * The slug of this wizard. Override this.
	 *
	 * @var string
	 */
	protected $slug = '';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Whether the wizard should be displayed in the Newspack submenu.
	 * 
	 * @var bool.
	 */
	protected $hidden = true;

	/**
	 * Initialize.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );

		if ( $this->hidden ) {
			add_action( 'admin_head', array( $this, 'hide_from_menus' ) );
		}
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_submenu_page( 'newspack', $this->get_name(), $this->get_name(), $this->capability, $this->slug, [ $this, 'render_wizard' ] );
	}

	/**
	 * Render the container for the wizard.
	 */
	public function render_wizard() {
		?>
		<div class="newspack-wizard" id="<?php echo esc_attr( $this->slug ); ?>">
		</div>
		<?php
	}

	/**
	 * Load up common JS/CSS for wizards.
	 */
	public function enqueue_scripts_and_styles() {
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @param WP_REST_Request $request API request object.
	 * @return bool|WP_Error
	 */
	public function api_permissions_check( $request ) {
		if ( ! current_user_can( $this->capability ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack' ),
				[
					'status' => 403,
				]
			);
		}
		return true;
	}

	/**
	 * Check whether a value is not empty.
	 * Intended for use as a `validate_callback` when registering API endpoints.
	 *
	 * @param mixed $value A param value.
	 * @return bool
	 */
	public function api_validate_not_empty( $value ) {
		if ( is_string( $value ) ) {
			$value = trim( $value );
		}

		return ! empty( $value );
	}

	/**
	 * Hide menu items from view so the pages exist, but the menu items do not.
	 */
	public function hide_from_menus() {
		global $submenu;

		$newspack_menu = $submenu['newspack'];
		foreach ( $newspack_menu as $key => $menu_item ) {
			if ( $menu_item[2] === $this->slug ) {
				unset( $submenu['newspack'][ $key ] );
			}
		}
	}

	/**
	 * Get the URL for this wizard.
	 *
	 * @return string
	 */
	public function get_url() {
		return admin_url( 'admin.php?page=' . $this->slug );
	}

	/**
	 * Whether this wizard has been completed.
	 *
	 * @todo This needs to actually handle completion.
	 * @return bool
	 */
	public function is_completed() {
		return false;
	}

	/**
	 * Get this wizard's name.
	 *
	 * @return string The wizard name.
	 */
	abstract public function get_name();

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	abstract public function get_description();

	/**
	 * Get the duration of this wizard.
	 *
	 * @return string A description of the expected duration (e.g. '10 minutes').
	 */
	abstract public function get_length();
}
