<?php
/**
 * Byline Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Byline;

use Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Byline_Block Class
 */
final class Byline_Block {
	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register newspack byline block.
	 *
	 * @return void
	 */
	public static function register_block() {
		register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[ 
				'render_callback' => [ __CLASS__, 'render_block' ],
				'uses_context'    => [ 'postId', 'postType' ],
			]
		);
	}

	/**
	 * This function is used to get the duotone class name from the preset value.
	 *
	 * @param  mixed $attributes Block attributes.
	 * @return string Constructed class name for duotone filter.
	 */
	public static function newspack_byline_get_duotone_class_name( $attributes ) {
		$duotone_preset = $attributes['style']['color']['duotone'] ?? null;
		if ( str_starts_with( $duotone_preset, 'var:preset|duotone|' ) ) {
			$slug = str_replace( 'var:preset|duotone|', '', $duotone_preset );
			return ' wp-duotone-' . sanitize_title( $slug );
		}
		return '';
	}

	/**
	 * Parse byline content to convert custom tags ([Author][/Author]) to HTML.
	 *
	 * @param string $byline_content Value of byline as stored in attribute.
	 * @param bool   $with_links     Whether to include links to author archives.
	 * @param bool   $with_avatars   Whether to include author avatars.
	 * @param int    $avatar_size    Avatar size in pixels.
	 * @param string $duotone_class  Duotone filter class for avatar images.
	 * @return string                Parsed byline with author tags converted to HTML.
	 */
	public static function parse_byline( $byline_content, $with_links = true, $with_avatars = false, $avatar_size = 48, $duotone_class = '' ) {
		if ( empty( $byline_content ) ) {
			return '';
		}

		// Regex to find all author tags and replace them.
		return preg_replace_callback(
			'/\[Author id=(\d*)\](.*?)\[\/Author\]/s',
			function ( $matches ) use ( $with_links, $with_avatars, $avatar_size, $duotone_class ) {
				$author_id   = $matches[1];
				$author_name = $matches[2];
				$author_url  = get_author_posts_url( $author_id );
				$html        = '';

				// Add avatar before author if enabled.
				if ( $with_avatars ) {
					$avatar_url  = get_avatar_url( $author_id, [ 'size' => $avatar_size * 2 ] );
					$class       = 'avatar avatar-' . esc_attr( $avatar_size ) . ' photo wp-block-newspack-avatar__image ';
					$avatar_html = '<img src="' . esc_url( $avatar_url ) . '" alt="' . esc_attr( $author_name ) . '" class="' . esc_attr( $class ) . '"width="' . esc_attr( $avatar_size ) . '" height="' . esc_attr( $avatar_size ) . '" loading="lazy" decoding="async" />';

					if ( ! empty( $duotone_class ) ) {
						$html .= '<span class="newspack-byline-avatar' . esc_attr( $duotone_class ) . '">' . $avatar_html . '</span>';
					} else {
						$html .= '<span class="newspack-byline-avatar abc">' . $avatar_html . '</span>';
					}
				}

				// Add link to author archive if enabled.
				if ( $with_links ) {
					$html .= '<a href="' . esc_url( $author_url ) . '" rel="author">' . esc_html( $author_name ) . '</a>';
				} else {
					$html .= esc_html( $author_name );
				}

				return '<span class="newspack-byline-author" data-author-id="' . esc_attr( $author_id ) . '">' . $html . '</span>';
			},
			$byline_content
		);
	}

	/**
	 * Block render callback.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content    The block content.
	 * @param object $block      The block.
	 *
	 * @return string The block HTML.
	 */
	public static function render_block( array $attributes, string $content, $block ) {
		$post_id = $block->context['postId'] ?? null;

		if ( empty( $post_id ) ) {
			return '';
		}

		$custom_byline      = $attributes['customByline'] ?? '';
		$show_avatar        = $attributes['showAvatar'] ?? false;
		$avatar_size        = $attributes['avatarSize'] ?? 24;
		$link_to_author     = $attributes['linkToAuthorArchive'] ?? true;
		$duotone_class      = self::newspack_byline_get_duotone_class_name( $attributes );
		$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'newspack-byline' ] );

		// If custom byline is empty, generate a default one using post author(s).
		if ( empty( $custom_byline ) ) {
			$authors = [];

			if ( function_exists( 'get_coauthors' ) ) {
				$authors = get_coauthors( $post_id );
			} else {
				$authors[] = get_userdata( get_post_field( 'post_author', $post_id ) );
			}

			if ( ! empty( $authors ) ) {
				$custom_byline = 'Published by ';
				foreach ( $authors as $index => $author ) {
					if ( $index > 0 ) {
						$custom_byline .= ( $index === count( $authors ) - 1 ) ? ' and ' : ', ';
					}
					$custom_byline .= "[Author id={$author->ID}]{$author->display_name}[/Author]";
				}
			}
		}

		$parsed_byline = self::parse_byline( $custom_byline, $link_to_author, $show_avatar, $avatar_size, $duotone_class );

		ob_start();
		?>
		<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<?php echo wp_kses_post( $parsed_byline ); ?>
		</div>
		<?php
		return ob_get_clean();
	}
}

Byline_Block::init();
