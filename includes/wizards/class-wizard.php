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
class Wizard {

	/**
	 * The name of this wizard. Override this.
	 *
	 * @var string
	 */
	protected $name = '';

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
	 * Initialize.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_submenu_page( 'newspack', $this->name, $this->name, $this->capability, $this->slug, [ $this, 'render_wizard' ] );
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
					'status' => 403
				]
			);
		}

		return true;
	}
}
