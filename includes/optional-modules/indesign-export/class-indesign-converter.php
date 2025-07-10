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

		$post_content = $this->process_post_content( $post->post_content, $options );
		$content_parts[] = $post_content;

		if ( ! empty( $this->styles['end_of_story'] ) ) {
			$content_parts[] = $this->styles['end_of_story'];
		}

		return implode( "\r\n", array_filter( $content_parts ) );
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
		$content = $this->convert_html_to_indesign( $content );

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

			// Remove closing tags for block elements.
			'/<\/(?:p|blockquote|cite|h[1-6])>/' => '',
		];

		foreach ( $conversions as $pattern => $replacement ) {
			$content = preg_replace( $pattern, $replacement, $content );
		}

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
