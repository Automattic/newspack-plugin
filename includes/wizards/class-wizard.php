<?php
/**
 * Common functionality for admin wizards.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Starter_Content;

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_WIZARD_COMPLETED_OPTION_PREFIX', 'newspack_wizard_completed_' );

/**
 * Common functionality for admin wizards. Override this class.
 */
abstract class Wizard {

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
	 * Whether the wizard should be displayed in the Newspack submenu.
	 *
	 * @var bool.
	 */
	protected $hidden = false;

	/**
	 * Priority setting for ordering admin submenu items.
	 *
	 * @var int.
	 */
	protected $menu_priority = 2;

	/**
	 * Array to store instances of section objects.
	 *
	 * @var Wizards\Section[]
	 */
	protected $sections = [];

	/**
	 * Initialize.
	 *
	 * @param array $args Array of optional arguments. i.e. `sections`.
	 * @return void 
	 * 
	 * @example
	 * $my_wizard = new My_Wizard( [ 'sections' => [ 'my-wizard-section' => 'Newspack\Wizards\My_Wizard\My_Wizard_Section' ] ] );
	 */
	public function __construct( $args = [] ) {
		add_action( 'admin_menu', [ $this, 'add_page' ], $this->menu_priority );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
		if ( isset( $args['sections'] ) ) {
			$this->load_wizard_sections( $args['sections'] );
		}
		add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_submenu_page(
			$this->hidden ? 'hidden' : 'newspack',
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Render the container for the wizard.
	 */
	public function render_wizard() {
		?>
		<div class="newspack-wizard <?php echo esc_attr( $this->slug ); ?>" id="<?php echo esc_attr( $this->slug ); ?>">
		</div>
		<?php
	}

	/**
	 * Is Wizard admin page being viewed.
	 *
	 * @return bool 
	 */
	public function is_wizard_page() {
		return filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) === $this->slug;
	}

	/**
	 * Load up common JS/CSS for wizards.
	 */
	public function enqueue_scripts_and_styles() {
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		Newspack::load_common_assets();

		// This script is just used for making newspack data available in JS vars.
		// It should not actually load a JS file.
		wp_register_script( 'newspack_data', '', [], '1.0', false );

		$plugin_data   = get_plugin_data( NEWSPACK_PLUGIN_FILE );
		$support_email = ( defined( 'NEWSPACK_SUPPORT_EMAIL' ) && NEWSPACK_SUPPORT_EMAIL ) ? NEWSPACK_SUPPORT_EMAIL : false;

		$urls = [
			'dashboard'      => Wizards::get_url( 'dashboard' ),
			'public_path'    => Newspack::plugin_url() . '/dist/',
			'bloginfo'       => [
				'name' => get_bloginfo( 'name' ),
			],
			'plugin_version' => [
				'label' => $plugin_data['Name'] . ' ' . $plugin_data['Version'],
			],
			'homepage'       => get_edit_post_link( get_option( 'page_on_front', false ) ),
			'site'           => get_site_url(),
			'support'        => esc_url( 'https://help.newspack.com/' ),
			'support_email'  => $support_email,
		];

		if ( Starter_Content::has_created_starter_content() && current_user_can( 'manage_options' ) ) {
			$urls['remove_starter_content'] = esc_url(
				add_query_arg(
					array(
						'newspack_reset' => 'starter-content',
					),
					Wizards::get_url( 'dashboard' )
				)
			);
		}

		if ( Newspack::is_debug_mode() && current_user_can( 'manage_options' ) ) {
			$urls['components_demo'] = esc_url( admin_url( 'admin.php?page=newspack-components-demo' ) );
			$urls['setup_wizard']    = esc_url( admin_url( 'admin.php?page=newspack-setup-wizard' ) );
			$urls['reset_url']       = esc_url(
				add_query_arg(
					array(
						'newspack_reset' => 'reset',
					),
					Wizards::get_url( 'dashboard' )
				)
			);
		}

		$aux_data = [
			'is_e2e'              => Starter_Content::is_e2e(),
			'is_debug_mode'       => Newspack::is_debug_mode(),
			'has_completed_setup' => get_option( NEWSPACK_SETUP_COMPLETE ),
			'site_title'          => get_option( 'blogname' ),
			'is_atomic'           => defined( 'ATOMIC_SITE_ID' ) && ATOMIC_SITE_ID,
		];

		wp_localize_script( 'newspack_data', 'newspack_urls', $urls );
		wp_localize_script( 'newspack_data', 'newspack_aux_data', $aux_data );
		wp_enqueue_script( 'newspack_data' );

		/**
		 * Register wizards.js with cache busting
		 */
		$asset_file = include dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/wizards.asset.php';
		wp_register_script(
			'newspack-wizards',
			Newspack::plugin_url() . '/dist/wizards.js',
			$this->get_script_dependencies(),
			$asset_file['version'] ?? NEWSPACK_PLUGIN_VERSION,
			true
		);
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
	 * Get the URL for this wizard.
	 *
	 * @return string
	 */
	public function get_url() {
		return esc_url( admin_url( 'admin.php?page=' . $this->slug ) );
	}

	/**
	 * Whether this wizard has been completed.
	 *
	 * @return bool
	 */
	public function is_completed() {
		return (bool) get_option( NEWSPACK_WIZARD_COMPLETED_OPTION_PREFIX . $this->slug, false );
	}

	/**
	 * Mark whether this wizard has been completed.
	 *
	 * @param bool $completed Whether the wizard has been completed (default: true).
	 */
	public function set_completed( $completed = true ) {
		update_option( NEWSPACK_WIZARD_COMPLETED_OPTION_PREFIX . $this->slug, (bool) $completed );
	}

	/**
	 * Get an array of Script dependencies
	 *
	 * @param array $dependencies Additional depedencies to add to the baseline ones.
	 * @return array An array of script dependencies.
	 */
	public function get_script_dependencies( $dependencies = [] ) {
		$base_dependencies = [ 'wp-components', 'wp-api-fetch', 'mediaelement-core' ];
		return array_merge( $base_dependencies, $dependencies );
	}

	/**
	 * Get an array of Stylesheet dependencies.
	 *
	 * @param array $dependencies Additional depedencies to add to the baseline ones.
	 * @return array An array of script dependencies.
	 */
	public function get_style_dependencies( $dependencies = [] ) {
		$base_dependencies = [ 'wp-components' ];
		return array_merge( $base_dependencies, $dependencies );
	}

	/**
	 * Get this wizard's name.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( $this->name, 'newspack-plugin' );
	}

	/**
	 * Load wizard sections.
	 * 
	 * @param string[] $sections Array of Section class names.
	 */
	public function load_wizard_sections( $sections ) {
		foreach ( $sections as $section_slug => $section_class ) {
			if ( ! class_exists( $section_class ) ) {
				wp_die( '<pre>' . esc_html( $section_class ) . '</pre> class does not exist.' );
			}
			$this->sections[ $section_slug ] = new $section_class( [ 'wizard_slug' => $this->slug ] );
		}
	}

	/**
	 * Add body class for wizard pages.
	 * 
	 * @param string $classes The current body classes.
	 */
	public function add_body_class( $classes ) {
		if ( ! $this->is_wizard_page() ) {
			return $classes;
		}
		$classes .= ' newspack-wizard-page';
		return $classes;
	}
}