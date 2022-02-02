<?php
/**
 * Patches for known issues affecting Newspack sites.
 *
 * @package Newspack
 */

namespace Newspack;

use Automattic\Jetpack\Search\Helper as JetpackSearchHelper;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Patches {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'wpseo_enhanced_slack_data', [ __CLASS__, 'use_cap_for_slack_preview' ] );
		add_action( 'admin_menu', [ __CLASS__, 'add_reusable_blocks_menu_link' ] );
		add_filter( 'wpseo_opengraph_url', [ __CLASS__, 'http_ogurls' ] );
		add_filter( 'map_meta_cap', [ __CLASS__, 'prevent_accidental_page_deletion' ], 10, 4 );
		add_action( 'pre_get_posts', [ __CLASS__, 'maybe_display_author_page' ] );

		// Disable WooCommerce image regeneration to prevent regenerating thousands of images.
		add_filter( 'woocommerce_background_image_regeneration', '__return_false' );

		// Jetpack Modules AMP Plus.
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'jetpack_modules_amp_plus' ] );
		add_action( 'wp_footer', [ __CLASS__, 'inject_jetpack_search_options_amp_plus' ] );
	}

	/**
	 * Enable AMP Plus for Jetpack Modules.
	 */
	public static function jetpack_modules_amp_plus() {
		if ( ! AMP_Enhancements::should_use_amp_plus() ) {
			return false;
		}
		$modules_scripts_handles = [
			'jetpack-instant-search', // Jetpack Instant Search.
			'jp-tracks',              // Tracks analytics library.
			'wp-i18n',                // Jetpack Instant Search dependency.
		];
		add_filter(
			'script_loader_tag',
			function( $tag, $handle, $src ) use ( $modules_scripts_handles ) {
				if ( in_array( $handle, $modules_scripts_handles, true ) ) {
					return '<script data-amp-plus-allowed async src="' . $src . '"></script>';
				}
				return $tag;
			},
			10,
			3
		);
	}

	/**
	 * Reinject Jetpack Instant Search options with AMP Plus enabled.
	 *
	 * Jetpack uses `wp_add_inline_script()`, which does not allow for custom tag
	 * attributes, so we have to inject it ourselves.
	 * See https://github.com/Automattic/jetpack/blob/ced14b36bcdb8219775342dcdb5c69952f485c75/projects/packages/search/src/instant-search/class-instant-search.php#L102-L109.
	 */
	public static function inject_jetpack_search_options_amp_plus() {
		if ( ! AMP_Enhancements::should_use_amp_plus() ) {
			return;
		}
		if ( ! class_exists( 'Jetpack' ) ) {
			return;
		}
		if ( ! \Jetpack::is_module_active( 'search' ) ) {
			return;
		}
		$options = JetpackSearchHelper::generate_initial_javascript_state();
		?>
		<script type="text/javascript" data-amp-plus-allowed>
			var JetpackInstantSearchOptions=JSON.parse(decodeURIComponent("<?php echo rawurlencode( wp_json_encode( $options ) ); ?>"));
		</script>
		<?php
	}

	/**
	 * Use the Co-Author in Slack preview metadata instead of the regular post author if needed.
	 *
	 * @param array $slack_data Array of data which will be output in twitter:data tags.
	 * @return array Modified $slack_data
	 */
	public static function use_cap_for_slack_preview( $slack_data ) {
		if ( function_exists( 'coauthors' ) && is_single() && isset( $slack_data[ __( 'Written by', 'wordpress-seo' ) ] ) ) {
			$slack_data[ __( 'Written by', 'wordpress-seo' ) ] = coauthors( null, null, null, null, false );
		}

		return $slack_data;
	}

	/**
	 * Add a menu link in WP Admin to easily edit and manage reusable blocks.
	 */
	public static function add_reusable_blocks_menu_link() {
		add_submenu_page( 'edit.php', 'manage_reusable_blocks', __( 'Reusable Blocks' ), 'read', 'edit.php?post_type=wp_block', '', 2 );
	}

	/**
	 * On Atomic infrastructure, URLs are `http` for Facebook requests.
	 * This forces the `og:url` to `http` for consistency, to prevent 301 redirect loop issues.
	 *
	 * @param string $og_url The opengraph URL.
	 * @return string modified $og_url
	 */
	public static function http_ogurls( $og_url ) {
		if ( defined( 'ATOMIC_SITE_ID' ) && ATOMIC_SITE_ID ) {
			$og_url = str_replace( 'https:', 'http:', $og_url );
		}
		return $og_url;
	}

	/**
	 * Prevent deletion of essential pages such as the homepage, blog posts page, and WooCommerce pages.
	 *
	 * @param array  $caps Primitive capabilities required of the user.
	 * @param string $cap Capability being checked.
	 * @param int    $user_id The user ID.
	 * @param array  $args Adds context to the capability check, typically starting with an object ID.
	 *
	 * @return array Filtered array of capabilities.
	 */
	public static function prevent_accidental_page_deletion( $caps, $cap, $user_id, $args ) {
		// If no $args to check, bail early.
		if ( empty( $args ) ) {
			return $caps;
		}

		$protected_post_ids = [];
		$post_id            = $args[0]; // First item is usually the post ID.

		// If $post_id isn't a valid post, bail early.
		if ( false === get_post_type( $post_id ) ) {
			return $caps;
		}

		// Dynamically look up post IDs for protected pages.
		// Homepage.
		$front_page = intval( get_option( 'page_on_front', -1 ) );
		if ( 0 < $front_page ) {
			$protected_post_ids[] = $front_page;
		}

		// Blog posts page.
		$posts_page = intval( get_option( 'page_for_posts', -1 ) );
		if ( 0 < $posts_page ) {
			$protected_post_ids[] = $posts_page;
		}

		// Privacy policy page.
		$privacy_policy = intval( get_option( 'wp_page_for_privacy_policy', -1 ) );
		if ( 0 < $privacy_policy ) {
			$protected_post_ids[] = $privacy_policy;
		}

		// WooCommerce pages.
		if ( function_exists( 'wc_get_page_id' ) && function_exists( 'wc_privacy_policy_page_id' ) ) {
			// WooCommerce myaccount page.
			$account_page = wc_get_page_id( 'myaccount' );
			if ( 0 < $account_page ) {
				$protected_post_ids[] = $account_page;
			}

			// WooCommerce shop page.
			$shop = wc_get_page_id( 'shop' );
			if ( 0 < $shop ) {
				$protected_post_ids[] = $shop;
			}

			// WooCommerce cart page.
			$cart = wc_get_page_id( 'cart' );
			if ( 0 < $cart ) {
				$protected_post_ids[] = $cart;
			}

			// WooCommerce checkout page.
			$checkout = wc_get_page_id( 'checkout' );
			if ( 0 < $checkout ) {
				$protected_post_ids[] = $checkout;
			}

			// WooCommerce view_order page.
			$view_order = wc_get_page_id( 'view_order' );
			if ( 0 < $view_order ) {
				$protected_post_ids[] = $view_order;
			}

			// WooCommerce terms page.
			$terms = wc_get_page_id( 'terms' );
			if ( 0 < $terms ) {
				$protected_post_ids[] = $terms;
			}

			// WooCommerce privacy policy page.
			$wc_privacy_policy = wc_privacy_policy_page_id();
			if ( 0 < $wc_privacy_policy ) {
				$protected_post_ids[] = $wc_privacy_policy;
			}
		}

		// If the current page ID is protected, and the capability being checked is for deletion, do not allow.
		if ( 'delete_post' === $cap && in_array( $post_id, $protected_post_ids, true ) ) {
			$caps[] = 'do_not_allow';
		}

		return $caps;
	}

	/**
	 * Force author pages for non-valid author roles to 404.
	 * Prevents author pages for users like subscribers and donors from being publicly accessible.
	 *
	 * @param WP_Query $query The WP query object.
	 */
	public static function maybe_display_author_page( $query ) {
		if ( $query->is_admin() || ! $query->is_main_query() || ! $query->is_author() ) {
			return;
		}

		$author_name = $query->query_vars['author_name'];
		$user        = get_user_by( 'login', $author_name );

		// For CAP guest authors, $user will be false.
		if ( ! $user || ! isset( $user->roles ) ) {
			return;
		}

		if ( is_array( $user->roles ) ) {
			/**
			 * Filter to add/remove the default user roles that are allowed to have public author archives.
			 *
			 * @param array $allowed_user_roles Array of WP user roles that can have author archives,
			 */
			$allowed_user_roles = apply_filters(
				'newspack_user_roles_with_author_archives',
				[
					'administrator',
					'editor',
					'author',
					'contributor',
				]
			);

			// Sometimes, authors who leave a publication are set to be subscribers. We still want those authors to have archives.
			$has_no_posts = function_exists( '\wpcom_vip_count_user_posts' ) ?
				0 === (int) \wpcom_vip_count_user_posts( $user->ID, 'post', true ) :
				0 === (int) count_user_posts( $user->ID, 'post', true ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.count_user_posts_count_user_posts

			if ( $has_no_posts && 0 === count( array_intersect( $user->roles, $allowed_user_roles ) ) ) {
				$query->set_404();
			}
		}
	}
}
Patches::init();
