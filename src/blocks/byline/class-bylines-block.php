<?php
/**
 * Bylines Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Bylines;

use Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Bylines_Block Class
 */
final class Bylines_Block {
	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register newspack bylines block.
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
	 * Parse byline content to convert custom tags ([Author][/Author]) to HTML.
	 *
	 * @param string $byline_content Value of byline as stored in attribute.
	 * @param bool   $with_links     Whether to include links to author archives.
	 * @param bool   $with_avatars   Whether to include author avatars.
	 * @param int    $avatar_size    Avatar size in pixels.
	 * @return string                Parsed byline with author tags converted to HTML.
	 */
	public static function parse_byline( $byline_content, $with_links = true, $with_avatars = false, $avatar_size = 48 ) {
		if ( empty( $byline_content ) ) {
			return '';
		}

		// Use regex to find all author tags and replace them.
		return preg_replace_callback(
			'/\[Author id=(\d*)\](.*?)\[\/Author\]/s',
			function( $matches ) use ( $with_links, $with_avatars, $avatar_size ) {
				$author_id   = $matches[1];
				$author_name = $matches[2];
				$author_url  = get_author_posts_url( $author_id );
				$html        = '';

				// Add avatar if enabled.
				if ( $with_avatars ) {
					$avatar_html = get_avatar( $author_id, $avatar_size );
					$html .= '<span class="newspack-byline-avatar">' . $avatar_html . '</span>';
				}

				// Add author name with or without link.
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
		$avatar_size        = $attributes['avatarSize'] ?? 48;
		$link_to_author     = $attributes['linkToAuthorArchive'] ?? true;
		$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'newspack-bylines' ] );

		// If no custom byline is set, generate a default one using post author(s).
		if ( empty( $custom_byline ) ) {
			$authors = [];
			
			if ( function_exists( 'get_coauthors' ) ) {
				$authors = get_coauthors( $post_id );
			} else {
				$authors[] = get_userdata( get_post_field( 'post_author', $post_id ) );
			}

			if ( ! empty( $authors ) ) {
				$custom_byline = 'By ';
				foreach ( $authors as $index => $author ) {
					if ( $index > 0 ) {
						$custom_byline .= ( $index === count( $authors ) - 1 ) ? ' and ' : ', ';
					}
					$custom_byline .= "[Author id={$author->ID}]{$author->display_name}[/Author]";
				}
			}
		}

		$parsed_byline = self::parse_byline( $custom_byline, $link_to_author, $show_avatar, $avatar_size );

		ob_start();
		?>
		<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
			<?php echo wp_kses_post( $parsed_byline ); ?>
		</div>
		<?php
		return ob_get_clean();
	}
}

Bylines_Block::init();