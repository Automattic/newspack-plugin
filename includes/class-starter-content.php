<?php
/**
 * Starter content management class.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WP_Query;

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
	protected static $starter_categories = [ 'Sports', 'Entertainment', 'Opinion', 'News', 'Events' ];

	/**
	 * Create a single post.
	 *
	 * @return int Post ID
	 */
	public static function create_post() {
		if ( ! function_exists( 'wp_insert_post' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}

		$paragraphs = explode( PHP_EOL, self::get_lipsum( 'paras', 5 ) );
		$title      = self::get_lipsum( 'words', wp_rand( 4, 7 ) );
		$post_data  = [
			'post_title'   => $title,
			'post_name'    => sanitize_title_with_dashes( $title, '', 'save' ),
			'post_status'  => 'publish',
			'post_content' => html_entity_decode(
				implode(
					'',
					array_map(
						function( $paragraph ) {
							return self::create_block( 'paragraph', null, $paragraph );
						},
						$paragraphs
					)
				)
			),
		];

		$post_id = wp_insert_post( $post_data );

		$attachment_id = self::add_featured_image( $post_id );

		$categories = get_categories(
			[
				'hide_empty' => false,
			]
		);
		$index      = wp_rand( 1, count( $categories ) - 1 );
		$category   = array_slice(
			$categories,
			$index,
			1
		)[0];

		wp_set_post_categories( $post_id, $category->term_id );
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
		$columns    = [];
		$categories = get_categories(
			[
				'hide_empty' => false,
			]
		);
		for ( $x = 0; $x < 2; $x++ ) {
			$index    = wp_rand( 1, count( $categories ) - 1 );
			$category = array_slice(
				$categories,
				$index, /* Start random at 1 to avoid getting "Uncategorized" */
				1
			)[0];

			$articles_block = self::create_block(
				'newspack-blocks/homepage-articles',
				[
					'sectionHeader' => $category->name,
					'categories'    => $category->term_id,
				]
			);

			$columns[] = self::create_block(
				'column',
				null,
				'<div class="wp-block-column">' . $articles_block . '</div>'
			);
		}
		$content   = self::create_block(
			'columns',
			null,
			'<div class="wp-block-columns">' . implode( '', $columns ) . '</div>'
		);
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
		set_theme_mod( 'active_style_pack', 'style-3' );
		set_theme_mod( 'header_solid_background', true );
		set_theme_mod( 'header_simplified', true );
		return true;
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
			file_get_contents( NEWSPACK_ABSPATH . 'assets/shared/images/newspack-logo.png' )
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
	 * Retrieve Lorem Ipsum from www.lipsum.com
	 *
	 * @param string $type The type of Lorem Ipsum to retrieve: paras|words.
	 * @param int    $amount The number of items to retrieve.
	 * @return string Lorem Ipsum.
	 */
	public static function get_lipsum( $type, $amount ) {
		$url = 'https://www.lipsum.com/feed/json?' .
		build_query(
			[
				'what'   => $type,
				'amount' => $amount,
				'start'  => 'no',
			]
		);

		$data = wp_safe_remote_get( $url );
		$json = json_decode( $data['body'], true );
		return $json['feed']['lipsum'];
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
	 *
	 * @return string Block markup.
	 */
	private static function add_featured_image( $post_id ) {
		if ( ! function_exists( 'download_url' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if ( ! function_exists( 'wp_crop_image' ) ) {
			require_once ABSPATH . 'wp-admin/includes/image.php';
		}
		$url = 'https://picsum.photos/1200/800';

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
}
