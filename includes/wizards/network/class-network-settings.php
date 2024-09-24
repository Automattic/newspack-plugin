<?php
/**
 * Network Settings Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Settings extends Wizard {

	use Admin_Header;

	const PAGE_TITLE = 'Network / Settings';
	const MENU_TITLE = 'Network';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-network';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Include Network Utils
		include_once 'class-network-utils.php';


		// @todo: can more of these hooks be moved into if( is_wizard_page() )??
		// review what needs to load or not on each page...

		add_action( 'admin_menu', [ $this, 'add_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
        add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

		if ( $this->is_wizard_page() ) {
			// Enqueue Wizards Admin Tabs script.
			$this->admin_header_init(
				[
					'tabs'  => [], 
					'title' => $this->get_name(), 
				]
			);
		}
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( static::PAGE_TITLE, 'newspack-plugin' );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {

        // If no site role, Settings becomes the parent menu item.
        if( empty( get_option( 'newspack_network_site_role', '' ) ) ) {

            // Parent menu page only
            add_menu_page(
                $this->get_name(),
                static::MENU_TITLE,
                $this->capability,
                $this->slug,
                [ $this, 'render_wizard' ],
                Network_Utils::get_parent_menu_icon(),
                Network_Utils::$parent_menu_position
            );

        } else {

            add_submenu_page(
                'edit.php?post_type=newspack_hub_nodes',
                $this->get_name(),
                __( 'Settings', 'newspack-plugin' ),
                $this->capability,
                $this->slug,
                array( '\Newspack_Network\Admin', 'render_page' ),
            );
    
        }



    }

	/**
	 * Render the container for the wizard.
	 */
	public function render_wizard() {

		// Call render page in the Network plugin.
		$plugin_render_function = [ '\Newspack_Network\Admin', 'render_page' ];
		if ( is_callable( $plugin_render_function ) ) {
			call_user_func( $plugin_render_function );
		} 
		// Not callable.
		else {
			?>
			<div class="newspack-wizard <?php echo esc_attr( $this->slug ); ?>" id="<?php echo esc_attr( $this->slug ); ?>">
				Render function is not callable.
			</div>
			<?php	
		}
	}

	/**
	 * Load up common JS/CSS for wizards.
	 */
	public function enqueue_scripts_and_styles() {
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		Newspack::load_common_assets();
	}

}
