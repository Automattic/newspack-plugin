<?php
/**
 * Newspack Advanced Settings functionality.
 *
 * @package Newspack
 */

namespace Newspack;

/**
 * Advanced Settings class.
 */
class Advanced_Settings {
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
					"<!-- wp:paragraph -->\n<p><em><mark style=\"background-color:#ffe54d\" class=\"has-inline-color\">We recommend generating your own Accessibility Statement using </mark></em><a href=\"https://www.w3.org/WAI/planning/statements/generator/#preview\" target=\"_blank\" rel=\"noreferrer noopener\"><mark style=\"background-color:#ffe54d\" class=\"has-inline-color\"><em>the tool on the W3C website</em></mark></a><em><mark style=\"background-color:#ffe54d\" class=\"has-inline-color\">. If you use this boilerplate text, please review, make whatever edits are needed, and update the highlighted text with your publication's information before publishing.</mark></em></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Conformance Status</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>This website strives to conform with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards and the European Accessibility Act (Directive (EU) 2019/882) requirements for digital services.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Accessible Features</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>All checkout components meet WCAG AA color contrast requirements (minimum 4.5:1 ratio for normal text, 3:1 for large text) and maintain consistent accessibility standards throughout.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading {\"level\":3} -->\n<h3 class=\"wp-block-heading\">Newspack Modal Checkout</h3>\n<!-- /wp:heading -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>Full keyboard accessibility with logical tab order</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Focus management ensures the modal captures focus when opened and returns focus to the triggering button when closed</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Focus trap prevents users from accidentally navigating outside the modal while it's open</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Modal can be closed using both the dedicated close button and the ESC key</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Form fields include appropriate labels and descriptions</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Error messages are properly associated with form controls</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:heading {\"level\":3} -->\n<h3 class=\"wp-block-heading\">Checkout Button Block</h3>\n<!-- /wp:heading -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>Fully keyboard accessible with tab navigation</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Button activation via Enter key for keyboard users</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Clear focus indicators for keyboard navigation</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Seamlessly connects to either modal or regular checkout depending on site configuration</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:heading {\"level\":3} -->\n<h3 class=\"wp-block-heading\">Donate Block</h3>\n<!-- /wp:heading -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>Complete keyboard navigation through all donation options</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Tab key navigation between form elements</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Arrow key navigation for selecting donation tabs and amounts</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Enter key activation for donation submission</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>All donation controls are properly labeled for screen readers</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Connects to appropriate checkout method (modal or regular) based on site settings</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:heading {\"level\":3} -->\n<h3 class=\"wp-block-heading\">Standard Checkout Process</h3>\n<!-- /wp:heading -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>Complete keyboard navigation support with logical tab sequence</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Proper form labeling and error handling</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Clear headings structure for screen reader navigation</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Assistive Technologies</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>The checkout components have been tested with the following assistive technologies:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>Keyboard-only navigation</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Browser zoom up to 200%%</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Known Limitations</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>We continuously work to improve accessibility. If you encounter any accessibility barriers, please contact us using the information below.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Feedback and Contact Information</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>We welcome your feedback on the accessibility of our services. If you encounter accessibility barriers or have suggestions for improvement:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p><strong>Email:</strong> <mark style=\"background-color:#ffe54d\" class=\"has-inline-color\">[Your accessibility contact email]</mark><br><strong>Phone:</strong> <mark style=\"background-color:#ffe54d\" class=\"has-inline-color\">[Your contact phone number]</mark><br><strong>Address:</strong> <mark style=\"background-color:#ffe54d\" class=\"has-inline-color\">[Your mailing address]</mark></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>We aim to respond to accessibility feedback within <mark style=\"background-color:#ffe54d\" class=\"has-inline-color\">[timeframe, e.g., 5 business days]</mark>.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Compliance and Monitoring</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>This accessibility statement was created on %s and reflects the accessibility features built into our Newspack checkout system. We are committed to maintaining these accessibility standards and encourage feedback to help us continue improving.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p><strong>Assessment Method:</strong> This statement is based on self-assessment and ongoing testing with assistive technologies.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p><strong>Technical Specifications:</strong> Our website's accessibility relies on the following technologies working with web browsers and assistive technologies installed on your computer:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>HTML</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>CSS</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>JavaScript</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Legal Framework</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph -->\n<p>This accessibility statement is provided in accordance with:</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>European Accessibility Act (Directive (EU) 2019/882)</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item -->\n<li>Web Content Accessibility Guidelines (WCAG) 2.1</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->\n\n<!-- wp:separator -->\n<hr class=\"wp-block-separator has-alpha-channel-opacity\"/>\n<!-- /wp:separator -->\n\n<!-- wp:paragraph -->\n<p><em>This statement demonstrates our ongoing commitment to accessibility and our compliance with the EU Accessibility Act requirements.</em></p>\n<!-- /wp:paragraph -->",
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
add_action( 'rest_api_init', [ 'Newspack\Advanced_Settings', 'register_rest_routes' ] );
