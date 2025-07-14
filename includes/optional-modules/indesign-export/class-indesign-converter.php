<?php
/**
 * InDesign Converter - Converts WordPress posts to Adobe InDesign Tagged Text format.
 *
 * @package Newspack
 */

namespace Newspack\Optional_Modules\InDesign_Export;

defined( 'ABSPATH' ) || exit;

/**
 * Converts WordPress posts to Adobe InDesign Tagged Text format.
 */
class InDesign_Converter {

	/**
	 * Default InDesign styles configuration.
	 *
	 * @var array
	 */
	private static $default_styles = [
		'headline'          => '<pstyle:24head>',
		'initial_paragraph' => '<pstyle:dropcap>',
		'paragraph'         => '<pstyle:text>',
		'subhead'           => '<pstyle:12sub>',
		'byline'            => '<pstyle:byline>By ',
		'pullquote'         => '<pstyle:pullquote>',
		'pullquote_name'    => '<pstyle:pullquotename>',
		'end_of_story'      => '<cstyle:endbullet>n<cstyle:>',
	];

	/**
	 * InDesign styles configuration.
	 *
	 * @var array
	 */
	private $styles;

	/**
	 * Constructor.
	 *
	 * @param array $styles Optional. Custom InDesign styles configuration.
	 */
	public function __construct( $styles = [] ) {
		$this->styles = wp_parse_args( $styles, self::$default_styles );
	}

	/**
	 * Convert a WordPress post to InDesign Tagged Text format.
	 *
	 * @param int|\WP_Post $post Post ID or WP_Post object.
	 * @param array        $options Optional conversion options.
	 * @return string|false InDesign Tagged Text content, or false on failure.
	 */
	public function convert_post( $post, $options = [] ) {
		$post = get_post( $post );
		if ( ! $post ) {
			return false;
		}

		$default_options = [
			'include_subtitle' => true,
			'include_byline'   => true,
		];
		$options = wp_parse_args( $options, $default_options );

		$content_parts = [];

		$content_parts[] = '<ASCII-WIN>';
		$content_parts[] = $this->styles['headline'] . $this->convert_text_for_indesign( $post->post_title );

		if ( $options['include_subtitle'] ) {
			$subtitle = $this->get_post_subtitle( $post );
			if ( $subtitle ) {
				$content_parts[] = $this->styles['subhead'] . $this->convert_text_for_indesign( $subtitle );
			}
		}

		if ( $options['include_byline'] ) {
			$byline = $this->get_byline( $post );
			if ( ! empty( $byline ) ) {
				$content_parts[] = $this->styles['byline'] . $this->convert_text_for_indesign( $byline );
			}
		}

		$post_content = $this->process_post_content( $post->post_content, $options );
		$content_parts[] = $post_content;

		if ( ! empty( $this->styles['end_of_story'] ) ) {
			$content_parts[] = $this->styles['end_of_story'];
		}

		return implode( "\r\n", array_filter( $content_parts ) );
	}

	/**
	 * Get the post subtitle.
	 *
	 * @param \WP_Post $post Post object.
	 * @return string|null Post subtitle or null if not available.
	 */
	private function get_post_subtitle( $post ) {
		$subtitle = get_post_meta( $post->ID, 'newspack_post_subtitle', true );
		return $subtitle ?? null;
	}

	/**
	 * Get the post authors.
	 *
	 * @param \WP_Post $post Post object.
	 * @return array Array of author objects.
	 */
	private function get_post_authors( $post ) {
		if ( function_exists( 'get_coauthors' ) ) {
			return get_coauthors( $post->ID );
		}

		$author = get_userdata( $post->post_author );
		return $author ? [ $author ] : [];
	}

	/**
	 * Format byline.
	 *
	 * @param \WP_Post $post Post object.
	 * @return string Formatted byline.
	 */
	private function get_byline( $post ) {
		$authors = $this->get_post_authors( $post );

		if ( empty( $authors ) ) {
			return '';
		}

		$author_names = [];
		foreach ( $authors as $author ) {
			$author_names[] = $author->display_name;
		}

		if ( 1 === count( $author_names ) ) {
			return $author_names[0];
		} else {
			$last_author = array_pop( $author_names );
			return implode( ', ', $author_names ) . ' & ' . $last_author;
		}
	}

	/**
	 * Process post content for InDesign export.
	 *
	 * @param string $content Raw post content.
	 * @param array  $options Conversion options.
	 * @return string Processed content.
	 */
	private function process_post_content( $content, $options = [] ) {
		$content = $this->remove_images_and_captions( $content );
		$content = $this->process_headings( $content );
		$content = $this->convert_html_to_indesign( $content );
		$content = preg_replace( '/<!--.*?-->/s', '', $content );
		$content = $this->convert_text_for_indesign( $content );
		$content = $this->clean_whitespace( $content );

		return $content;
	}

	/**
	 * Remove images (figures) and captions from content.
	 *
	 * @param string $content Post content.
	 * @return string Content without images and captions.
	 */
	private function remove_images_and_captions( $content ) {
		$content = preg_replace( '/<figure[^>]*>.*?<\/figure>/is', '', $content );
		$content = preg_replace( '/<figcaption[^>]*>.*?<\/figcaption>/is', '', $content );
		$content = preg_replace( '/<img[^>]*>/i', '', $content );

		return $content;
	}

	/**
	 * Process headings in the content.
	 *
	 * @param string $content Post content.
	 * @return string Content with processed subheads.
	 */
	private function process_headings( $content ) {
		$content = preg_replace_callback(
			'/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/is',
			function ( $matches ) {
				switch ( $matches[1] ) {
					/**
					 * Process subheadings (h4 elements) in the content.
					 */
					case '4':
						return $this->styles['subhead'] . $this->convert_text_for_indesign( $matches[2] );
					/**
					 * TODO: Handle other heading levels as per requirements.
					 * For now, treating them as regular paragraphs.
					 */
					case '2':
					case '3':
					case '5':
					case '6':
					default:
						return $this->styles['paragraph'] . $this->convert_text_for_indesign( $matches[2] );
				}
			},
			$content
		);

		return $content;
	}

	/**
	 * Convert HTML elements to InDesign tagged text equivalents.
	 *
	 * @param string $content Post content.
	 * @return string Content with InDesign tags.
	 */
	private function convert_html_to_indesign( $content ) {
		$conversions = [
			// Blockquotes and pullquotes.
			'/<blockquote[^>]*class="[^"]*wp-block-quote[^"]*"[^>]*>/' => $this->styles['pullquote'],
			'/<blockquote[^>]*>/'                => $this->styles['pullquote'],
			'/<cite[^>]*>/'                      => $this->styles['pullquote_name'],

			// Paragraphs.
			'/<(?!pstyle:)(p[^>]*)>/'            => $this->styles['paragraph'],

			// Typography.
			'/<strong[^>]*>/'                    => '<cTypeface:Bold>',
			'/<\/strong>/'                       => '<cTypeface:>',
			'/<b[^>]*>/'                         => '<cTypeface:Bold>',
			'/<\/b>/'                            => '<cTypeface:>',
			'/<em[^>]*>/'                        => '<cTypeface:Italic>',
			'/<\/em>/'                           => '<cTypeface:>',
			'/<i[^>]*>/'                         => '<cTypeface:Italic>',
			'/<\/i>/'                            => '<cTypeface:>',

			// Remove links but keep content.
			'/<a[^>]*>/'                         => '',
			'/<\/a>/'                            => '',

			// Remove closing tags for block elements and add line breaks.
			'/<\/(?:p|blockquote|cite|h[1-6])>/' => "\r\n",
		];

		foreach ( $conversions as $pattern => $replacement ) {
			$content = preg_replace( $pattern, $replacement, $content );
		}

		return $content;
	}

	/**
	 * Convert text for InDesign, handling special characters and typography.
	 *
	 * @param string $text Text to convert.
	 * @return string Converted text.
	 */
	private function convert_text_for_indesign( $text ) {
		// Character conversions for InDesign Tagged Text.
		$conversions = [
			// Dashes.
			'--' => '<0x2014>',
			'—'  => '<0x2014>',
			'–'  => '<0x2014>',

			// Quotes.
			'“'  => '"',
			'”'  => '"',
			'‘'  => "'",
			'’'  => "'",

			// Ellipsis.
			'…'  => '...',

			// Special characters.
			'•'  => '<CharStyle:bullet>n<CharStyle:>',

			// accented characters.
			'ā'  => '<0x0101>',
			'à'  => '<0x00E0>',
			'é'  => '<0x00E9>',
			'è'  => '<0x00E8>',
			'ê'  => '<0x00EA>',
			'É'  => '<0x00C9>',
			'È'  => '<0x00C8>',
			'í'  => '<0x00ED>',
			'ñ'  => '<0x00F1>',
			'Ñ'  => '<0x00D1>',
			'ö'  => '<0x00F6>',
			'ô'  => '<0x00F4>',
			'ő'  => '<0x0151>',
			'û'  => '<0x00FB>',
			'Û'  => '<0x00DB>',
			'ú'  => '<0x00FA>',
		];

		$text = str_replace( array_keys( $conversions ), array_values( $conversions ), $text );
		$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		// Convert remaining HTML entities.
		$text = str_replace(
			[ '&nbsp;', '&amp;', '&lt;', '&gt;' ],
			[ ' ', '&', '<', '>' ],
			$text
		);

		// Remove non-breaking space UTF-8 character.
		$text = str_replace( "\xC2\xA0", ' ', $text );

		return $text;
	}

	/**
	 * Clean up whitespace and line breaks.
	 *
	 * @param string $content Content to clean.
	 * @return string Cleaned content.
	 */
	private function clean_whitespace( $content ) {
		$content = preg_replace( '/\n{2,}/', "\r\n", $content );
		$content = trim( $content );

		return $content;
	}

	/**
	 * Update the InDesign styles configuration.
	 *
	 * @param array $styles New styles configuration.
	 */
	public function set_styles( $styles ) {
		$this->styles = wp_parse_args( $styles, self::$default_styles );
	}

	/**
	 * Get the current InDesign styles configuration.
	 *
	 * @return array Current styles configuration.
	 */
	public function get_styles() {
		return $this->styles;
	}

	/**
	 * Get the default InDesign styles configuration.
	 *
	 * @return array Default styles configuration.
	 */
	public static function get_default_styles() {
		return self::$default_styles;
	}
}
