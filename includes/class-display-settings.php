<?php
/**
 * Newspack Display Settings functionality.
 *
 * @package Newspack
 */

namespace Newspack;

/**
 * Display Settings class.
 */
class Display_Settings {
	/**
	 * Create an accessibility statement page.
	 *
	 * @return array|WP_Error The created page data or error.
	 */
	public static function create_accessibility_statement_page() {
		// Check if page already exists by ID.
		$page_id = get_theme_mod( 'accessibility_statement_page_id' );
		if ( $page_id ) {
			$page = get_post( $page_id );
			if ( $page && 'page' === $page->post_type && 'trash' !== get_post_status( $page->ID ) ) {
				$page_data = [
					'editUrl' => get_edit_post_link( $page->ID, 'raw' ),
					'status'  => get_post_status( $page->ID ),
					'pageUrl' => get_permalink( $page->ID ),
				];
				return $page_data;
			}
		}

		// Create the page.
		$page_id = wp_insert_post(
			[
				'post_title'   => __( 'Accessibility Statement', 'newspack-plugin' ),
				'post_name'    => 'accessibility-statement',
				'post_status'  => 'draft',
				'post_type'    => 'page',
				'post_content' => sprintf(
					"<!-- wp:paragraph -->\n<p><em>We recommend generating your own Accessibility Statement using <a href=\"https://www.w3.org/WAI/planning/statements/generator/#preview\" target=\"_blank\" rel=\"noreferrer noopener\">the tool on the W3C website</a>. If you use this boilerplate text, please update the highlighted text with your publication's information before publishing.</em> </p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>This is an accessibility statement from <strong><mark style=\"background-color:#fff641\" class=\"has-inline-color\">[Organization Name]</mark></strong>.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Conformance status</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>The <a href=\"https://www.w3.org/WAI/standards-guidelines/wcag/\">Web Content Accessibility Guidelines (WCAG)</a> defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. <strong><mark style=\"background-color:#fff641\" class=\"has-inline-color\">[Publication Name]</mark></strong> is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Feedback</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>We welcome your feedback on the accessibility of <strong><mark style=\"background-color:#fff641\" class=\"has-inline-color\">[Publication Name]</mark></strong>. Please let us know if you encounter accessibility barriers on <strong><mark style=\"background-color:#fff641\" class=\"has-inline-color\">[Publication Name]</mark></strong>:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Phone: <strong><mark style=\"background-color:#fff641\" class=\"has-inline-color\">[(555) 123-4567]</mark></strong><br>E-mail: <strong><mark style=\"background-color:#fff641\" class=\"has-inline-color\">[accessibility@example.com]</mark></strong></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->\n\n<!-- wp:heading {\"level\":3} -->\n<h3 class=\"wp-block-heading\">Date</h3>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>This statement was created on %s.</p>\n<!-- /wp:paragraph -->",
					date_i18n( __( 'F j, Y', 'newspack-plugin' ) )
				),
			]
		);

		if ( is_wp_error( $page_id ) ) {
			return $page_id;
		}

		// Save the page ID.
		set_theme_mod( 'accessibility_statement_page_id', $page_id );

		$page_data = [
			'editUrl' => get_edit_post_link( $page_id, 'raw' ),
			'status'  => 'draft',
			'pageUrl' => get_permalink( $page_id ),
		];
		return $page_data;
	}

	/**
	 * Get accessibility statement page data.
	 * The function to actually output the link lives in the Classic Theme.
	 *
	 * TODO: Create a block for the Block Theme that outputs the format we need there.
	 *
	 * @return array|false The page data or false if not set.
	 */
	public static function get_accessibility_statement_page() {
		$page_id = get_theme_mod( 'accessibility_statement_page_id' );
		if ( ! $page_id ) {
			return false;
		}

		$page = get_post( $page_id );
		if ( ! $page || 'page' !== $page->post_type ) {
			// If page doesn't exist or isn't a page, clear the stored ID.
			remove_theme_mod( 'accessibility_statement_page_id' );
			return false;
		}

		$page_data = [
			'editUrl' => get_edit_post_link( $page->ID, 'raw' ),
			'pageUrl' => get_permalink( $page->ID ),
			'status'  => get_post_status( $page->ID ),
			'title'   => get_the_title( $page->ID ),
		];
		return $page_data;
	}

	/**
	 * Register REST API endpoints.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'newspack/v1',
			'/wizard/newspack-settings/accessibility-statement',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'api_create_accessibility_statement' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			'newspack/v1',
			'/wizard/newspack-settings/accessibility-statement',
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'api_get_accessibility_statement' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * API callback for creating accessibility statement page.
	 *
	 * @return WP_REST_Response|WP_Error Response object.
	 */
	public static function api_create_accessibility_statement() {
		$result = self::create_accessibility_statement_page();
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return rest_ensure_response( $result );
	}

	/**
	 * API callback for getting accessibility statement page.
	 *
	 * @return WP_REST_Response Response object.
	 */
	public static function api_get_accessibility_statement() {
		$page_data = self::get_accessibility_statement_page();
		return rest_ensure_response( $page_data );
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @return bool|WP_Error
	 */
	public static function api_permissions_check() {
		if ( ! current_user_can( 'edit_pages' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack-plugin' ),
				[ 'status' => 403 ]
			);
		}
		return true;
	}
}

// Register REST routes.
add_action( 'rest_api_init', [ 'Newspack\Display_Settings', 'register_rest_routes' ] );
