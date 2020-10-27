<?php
/**
 * Starter content management class.
 *
 * @package Newspack
 */

namespace Newspack;

require_once NEWSPACK_COMPOSER_ABSPATH . 'autoload.php';

use \WP_Error, \WP_Query, Newspack\Theme_Manager;

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_STARTER_CONTENT_CATEGORIES', '_newspack_starter_content_categories' );
define( 'NEWSPACK_STARTER_CONTENT_POSTS', '_newspack_starter_content_posts' );

/**
 * Manages settings for PWA.
 */
class Starter_Content {

	/**
	 * Starter categories;
	 *
	 * @var array A set of starter categories.
	 */
	protected static $starter_categories = [ 'Featured', 'Sports', 'Entertainment', 'Opinion', 'News', 'Events', 'Longform', 'Arts', 'Politics', 'Science', 'Tech', 'Health' ];

	/**
	 * Create a single post.
	 *
	 * @param number $post_index Post index.
	 * @return int Post ID
	 */
	public static function create_post( $post_index ) {
		if ( ! function_exists( 'wp_insert_post' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}
		$page_templates = [ '', 'single-feature.php' ];
		$paragraphs     = explode( PHP_EOL, self::get_lipsum( 'paras', 5 ) );
		$title          = self::generate_title();
		$post_data      = [
			'post_title'   => $title,
			'post_name'    => sanitize_title_with_dashes( $title, '', 'save' ),
			'post_status'  => 'publish',
			'post_content' => html_entity_decode(
				implode(
					'',
					array_map(
						function( $paragraph ) {
							return strlen( trim( $paragraph ) ) ?
								self::create_block( 'paragraph', null, '<p>' . $paragraph . '</p>' ) :
								'';
						},
						$paragraphs
					)
				)
			),
		];

		if ( self::is_e2e() ) {
			$post_data['post_date'] = '2020-03-03 10:00:00';
		};

		$post_id = wp_insert_post( $post_data );

		$page_template_id = self::is_e2e() ? ( $post_index % 2 ) : wp_rand( 0, 1 );

		$page_template = $page_templates[ $page_template_id ];

		$update = [
			'ID'            => $post_id,
			'page_template' => $page_template,
		];

		wp_update_post( $update );

		$newspack_featured_image_positions = [ null, 'behind', 'beside' ];

		$newspack_featured_image_index = self::is_e2e() ? ( $post_index % 3 ) : wp_rand( 0, 2 );

		$newspack_featured_image_position = $newspack_featured_image_positions[ $newspack_featured_image_index ];

		if ( $newspack_featured_image_position ) {
			add_post_meta( $post_id, 'newspack_featured_image_position', $newspack_featured_image_position );
		}

		$attachment_id = self::add_featured_image( $post_id, $post_index );

		$categories = get_categories(
			[
				'orderby'    => 'count',
				'order'      => 'ASC',
				'hide_empty' => false,
				'exclude'    => '1', // Exclude 'Uncategorized' which has ID of 1.
				'number'     => 1,
			]
		);

		$category_ids = get_option( NEWSPACK_STARTER_CONTENT_CATEGORIES );
		$category_id  = self::is_e2e() ? $category_ids[ $post_index ] : $categories[0];

		wp_set_post_categories( $post_id, $category_id );
		wp_publish_post( $post_id );

		return $post_id;
	}

	/**
	 * Create default categories;
	 */
	public static function create_categories() {
		if ( ! function_exists( 'wp_create_category' ) ) {
			require_once ABSPATH . 'wp-admin/includes/taxonomy.php';
		}
		$category_ids = array_map(
			function( $category ) {
				return wp_create_category( $category );
			},
			self::$starter_categories
		);
		update_option( NEWSPACK_STARTER_CONTENT_CATEGORIES, $category_ids );
		return $category_ids;
	}

	/**
	 * Create a homepage, populated with blocks;
	 */
	public static function create_homepage() {
		if ( ! function_exists( 'wp_insert_post' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}
		$categories = get_categories(
			[
				'hide_empty' => false,
			]
		);
		ob_start();
		?>
		<!-- wp:columns {"className":"is-style-borders"} --><div class="wp-block-columns is-style-borders">

			<!-- wp:column {"width":66.66} --><div class="wp-block-column" style="flex-basis:66.66%">

				<!-- wp:newspack-blocks/homepage-articles {"postsToShow":1,"categories":[<?php echo esc_attr( $categories[1]->term_id ); ?>],"sectionHeader":"<?php echo esc_html( $categories[1]->name ); ?>"} /-->

			</div><!-- /wp:column -->
			<!-- wp:column {"width":33.33} --><div class="wp-block-column" style="flex-basis:33.33%">

				<!-- wp:newspack-blocks/homepage-articles {"showExcerpt":false,"imageShape":"square","showAvatar":false,"postsToShow":3,"mediaPosition":"left","categories":[<?php echo esc_attr( $categories[2]->term_id ); ?>],"typeScale":2,"imageScale":1,"sectionHeader":"<?php echo esc_html( $categories[2]->name ); ?>"} /-->

				<!-- wp:separator {"className":"is-style-wide"} --><hr class="wp-block-separator is-style-wide"/><!-- /wp:separator -->

				<!-- wp:newspack-blocks/homepage-articles {"showExcerpt":false,"imageShape":"square","postsToShow":3, "mediaPosition":"left","categories":[<?php echo esc_attr( $categories[3]->term_id ); ?>],"typeScale":2,"imageScale":1,"sectionHeader":"<?php echo esc_html( $categories[3]->name ); ?>"} /-->

			</div><!-- /wp:column -->

		</div><!-- /wp:columns -->

		<!-- wp:separator {"className":"is-style-wide"} --><hr class="wp-block-separator is-style-wide"/><!-- /wp:separator -->

		<!-- wp:columns {"className":"is-style-borders"} --><div class="wp-block-columns is-style-borders">

			<!-- wp:column --><div class="wp-block-column">

				<!-- wp:newspack-blocks/homepage-articles {"className":"is-style-borders","showExcerpt":false,"showAuthor":false,"postsToShow":1,"categories":[<?php echo esc_attr( $categories[4]->term_id ); ?>],"typeScale":3,"imageScale":1,"sectionHeader":"<?php echo esc_html( $categories[4]->name ); ?>"} /-->

				<!-- wp:newspack-blocks/homepage-articles {"className":"is-style-borders","showExcerpt":false,"showAuthor":false,"showAvatar":false,"postsToShow":2,"mediaPosition":"left","categories":[<?php echo esc_attr( $categories[5]->term_id ); ?>],"typeScale":2,"imageScale":1} /-->

			</div><!-- /wp:column -->

			<!-- wp:column --><div class="wp-block-column">

				<!-- wp:newspack-blocks/homepage-articles {"className":"is-style-borders","showExcerpt":false,"showAuthor":false,"postsToShow":1,"categories":[<?php echo esc_attr( $categories[6]->term_id ); ?>],"typeScale":3,"imageScale":1,"sectionHeader":"<?php echo esc_html( $categories[6]->name ); ?>"} /-->

				<!-- wp:newspack-blocks/homepage-articles {"className":"is-style-borders","showExcerpt":false,"showAuthor":false,"showAvatar":false,"postsToShow":2,"mediaPosition":"left","categories":[<?php echo esc_attr( $categories[7]->term_id ); ?>],"typeScale":2,"imageScale":1} /-->

			</div><!-- /wp:column -->

			<!-- wp:column --><div class="wp-block-column">

				<!-- wp:newspack-blocks/homepage-articles {"className":"is-style-borders","showExcerpt":false,"showImage":false,"showAuthor":false,"showAvatar":false,"postsToShow":1,"mediaPosition":"left","categories":[<?php echo esc_attr( $categories[8]->term_id ); ?>],"imageScale":1,"sectionHeader":"<?php echo esc_html( $categories[8]->name ); ?>"} /-->

				<!-- wp:newspack-blocks/homepage-articles {"className":"is-style-borders","showExcerpt":false,"showImage":false,"showAuthor":false,"showAvatar":false,"postsToShow":4,"mediaPosition":"left","categories":[<?php echo esc_attr( $categories[9]->term_id ); ?>],"typeScale":3,"imageScale":1} /-->

			</div><!-- /wp:column -->

		</div><!-- /wp:columns -->
		<?php
		$content = ob_get_clean();

		$post_data = [
			'post_title'   => 'Homepage',
			'post_type'    => 'page',
			'post_content' => $content,
		];
		$page_id   = wp_insert_post( $post_data );
		wp_publish_post( $page_id );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $page_id );
		set_theme_mod( 'hide_front_page_title', true );
		return true;
	}

	/**
	 * Set up theme.
	 */
	public static function initialize_theme() {
		$logo_id = self::upload_logo();
		if ( $logo_id ) {
			set_theme_mod( 'custom_logo', $logo_id );
			set_theme_mod( 'logo_size', 0 );
		}
		set_theme_mod( 'header_solid_background', true );
		set_theme_mod( 'header_simplified', true );
		return true;
	}

	/**
	 * Set theme style.
	 *
	 * @param string $style Style id.
	 */
	public static function set_theme( $style ) {
		Theme_Manager::install_activate_theme( $style );
		return self::get_theme();
	}

	/**
	 * Get theme style.
	 *
	 * @return string Style id.
	 */
	public static function get_theme() {
		$theme_object = wp_get_theme();
		return $theme_object->get_stylesheet();
	}

	/**
	 * Upload Newspack logo as placeholder.
	 */
	public static function upload_logo() {

		$attachment_title = esc_attr__( 'Newspack Placeholder Logo', 'newspack' );

		$args = [
			'posts_per_page' => 1,
			'post_type'      => 'attachment',
			'name'           => $attachment_title,
		];

		$logo_query = new WP_Query( $args );
		if ( $logo_query && isset( $logo_query->posts, $logo_query->posts[0] ) ) {
			return null;
		}

		if ( ! function_exists( 'wp_upload_bits' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if ( ! function_exists( 'wp_crop_image' ) ) {
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}

		$file = wp_upload_bits(
			'newspack-logo.png',
			null,
			file_get_contents( NEWSPACK_ABSPATH . 'includes/raw_assets/images/newspack-logo.png' )
		);

		if ( ! $file || empty( $file['file'] ) ) {
			return null;
		}

		$wp_filetype = wp_check_filetype( $file['file'], null );

		$attachment = [
			'post_mime_type' => $wp_filetype['type'],
			'post_title'     => $attachment_title,
			'post_content'   => '',
			'post_status'    => 'inherit',
		];

		$attachment_id   = wp_insert_attachment( $attachment, $file['file'] );
		$attachment_data = wp_generate_attachment_metadata( $attachment_id, $file['file'] );

		wp_update_attachment_metadata( $attachment_id, $attachment_data );
		return $attachment_id;
	}

	/**
	 * Generate a post title
	 *
	 * @return string The title.
	 */
	public static function generate_title() {
		if ( self::is_e2e() ) {
			return file_get_contents( NEWSPACK_ABSPATH . 'includes/raw_assets/markup/title.txt' );
		}
		$title = self::get_lipsum( 'words', wp_rand( 7, 14 ) );
		$title = ucfirst( strtolower( str_replace( '.', '', $title ) ) ); // Remove periods, convert to sentence case.
		return $title;
	}

	/**
	 * Retrieve Lorem Ipsum from www.lipsum.com
	 *
	 * @param string $type The type of Lorem Ipsum to retrieve: paras|words.
	 * @param int    $amount The number of items to retrieve.
	 * @return string Lorem Ipsum.
	 */
	public static function get_lipsum( $type, $amount ) {
		if ( self::is_e2e() ) {
			return file_get_contents( NEWSPACK_ABSPATH . 'includes/raw_assets/markup/body.txt' );
		}
		$lipsum = new \joshtronic\LoremIpsum();
		switch ( $type ) {
			case 'paras':
				$text = $lipsum->paragraphs( $amount + 1 );
				$text = implode( PHP_EOL, array_slice( explode( PHP_EOL, $text ), 1 ) );
				break;
			default:
				$text = $lipsum->words( $amount + 12 );
				$text = implode( ' ', array_slice( explode( ' ', $text ), 12 ) );
				break;
		}
		return $text;
	}

	/**
	 * Create a Gutenberg Block
	 *
	 * @param string $block_type The block type.
	 * @param array  $attributes The attributes of the block.
	 * @param string $content The content of the block.
	 *
	 * @return string Block markup.
	 */
	private static function create_block( $block_type = null, $attributes = null, $content = '' ) {
		return sprintf(
			'<!-- wp:%s %s -->%s<!-- /wp:%s -->',
			$block_type,
			$attributes ? wp_json_encode( $attributes ) : '',
			$content,
			$block_type
		);
	}

	/**
	 * Download and add a featured image to a post.
	 *
	 * @param int $post_id The post ID.
	 * @param int $post_index The index of the post within the set of starter content posts.
	 *
	 * @return string Block markup.
	 */
	private static function add_featured_image( $post_id, $post_index ) {
		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if ( ! function_exists( 'wp_crop_image' ) ) {
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}

		// Use same image everywhere for e2e.
		$url = self::is_e2e() ? 'https://picsum.photos/id/424/1200/800' : 'https://picsum.photos/1200/800';

		$temp_file = download_url( $url );

		if ( is_wp_error( $temp_file ) ) {
			return false;
		}

		$mime_type = mime_content_type( $temp_file );

		$file = array(
			'name'     => 'automated_upload.jpg',
			'type'     => $mime_type,
			'tmp_name' => $temp_file,
			'error'    => 0,
			'size'     => filesize( $temp_file ),
		);

		$overrides = array(
			'test_form'   => false,
			'test_size'   => true,
			'test_upload' => true,
		);

		$file_attributes = wp_handle_sideload( $file, $overrides );
		if ( is_wp_error( $file_attributes ) || ! empty( $file_attributes['error'] ) ) {
			return null;
		}
		$filename      = $file_attributes['file'];
		$filetype      = wp_check_filetype( basename( $filename ), null );
		$wp_upload_dir = wp_upload_dir();

		// Prepare an array of post data for the attachment.
		$attachment = array(
			'guid'           => $wp_upload_dir['url'] . '/' . basename( $filename ),
			'post_mime_type' => $filetype['type'],
			'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $filename ) ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		$attach_id   = wp_insert_attachment( $attachment, $filename, $post_id );
		$attach_data = wp_generate_attachment_metadata( $attach_id, $filename );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		set_post_thumbnail( $post_id, $attach_id );
	}

	/**
	 * Is this an E2E testing environment?
	 *
	 * @return bool E2E testing environment?
	 */
	public static function is_e2e() {
		return defined( 'WP_NEWSPACK_DETERMINISTIC_STARTER_CONTENT' ) && WP_NEWSPACK_DETERMINISTIC_STARTER_CONTENT;
	}
}
