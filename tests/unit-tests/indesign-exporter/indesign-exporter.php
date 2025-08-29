<?php
/**
 * Tests the InDesign Exporter functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Optional_Modules\InDesign_Export\InDesign_Converter;

/**
 * Tests the InDesign Exporter functionality.
 */
class Newspack_Test_InDesign_Exporter extends WP_UnitTestCase {
	/**
	 * Test converting a simple post.
	 */
	public function test_convert_simple_post() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<p>This is a test post.</p>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<ASCII-WIN>', $content );
		$this->assertStringContainsString( '<pstyle:24head>Test Post', $content );
		$this->assertStringContainsString( '<pstyle:text>This is a test post.', $content );
	}

	/**
	 * Test converting blockquotes.
	 */
	public function test_convert_blockquote() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<blockquote>This is a test blockquote.</blockquote> <blockquote><p>This is a test post with paragraph.</p><cite>John Doe</cite></blockquote>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:pullquote>This is a test blockquote.', $content );
		$this->assertStringContainsString( '<pstyle:pullquote>This is a test post with paragraph.', $content );
		$this->assertStringContainsString( '<pstyle:pullquotename>John Doe', $content );
	}

	/**
	 * Test converting lists.
	 */
	public function test_convert_list() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<ul><li>Item 1.</li><li>Item 2.</li></ul>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<bnListType:Bullet>Item 1.', $content );
		$this->assertStringContainsString( '<bnListType:Bullet>Item 2.', $content );
	}

	/**
	 * Test cleaning HTML markup.
	 */
	public function test_clean_html_markup() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<div><p>This is a test post.</p></div>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:text>This is a test post.', $content );
		$this->assertStringNotContainsString( '<div>', $content );
		$this->assertStringNotContainsString( '<p>', $content );
	}

	/**
	 * Test converting superscript and subscript.
	 */
	public function test_convert_superscript_and_subscript() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<p>This is a test post with <sup>superscript</sup> and <sub>subscript</sub>.</p>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:text>This is a test post with <cPosition:Superscript>superscript<cPosition:> and <cPosition:Subscript>subscript<cPosition:>.', $content );
	}

	/**
	 * Test cleaning img markup.
	 */
	public function test_clean_img_markup() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<figure class="wp-block-image size-large"><img src="http://localhost/image.jpg" alt="" class="wp-image-1234"/><figcaption class="wp-element-caption">My Caption</figcaption></figure>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringNotContainsString( '<figure', $content );
		$this->assertStringNotContainsString( '<figcaption', $content );
		$this->assertStringNotContainsString( '<img', $content );
		$this->assertStringNotContainsString( 'My Caption', $content );
	}

	/**
	 * Test converting HTML entities.
	 */
	public function test_convert_html_entities() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<p>This is a test post with &nbsp;, &amp;, &lt;, &gt; and •.</p>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:text>This is a test post with  , &, <, > and <CharStyle:bullet>n<CharStyle:>.', $content );
	}

	/**
	 * Test converting special characters.
	 */
	public function test_convert_special_characters() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<p>àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿĀāĂă…€</p>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<0x00E0><0x00E1><0x00E2><0x00E3><0x00E4><0x00E5><0x00E6><0x00E7><0x00E8><0x00E9><0x00EA><0x00EB><0x00EC><0x00ED><0x00EE><0x00EF><0x00F1><0x00F2><0x00F3><0x00F4><0x00F5><0x00F6><0x00F8><0x00F9><0x00FA><0x00FB><0x00FC><0x00FD><0x00FF><0x0100><0x0101><0x0102><0x0103><0x2026><0x20AC>', $content );
	}

	/**
	 * Test blocks with custom tags.
	 */
	public function test_convert_blocks_with_custom_tags() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<!-- wp:paragraph {"indesignTag":"customparagraph"} --><p>This is a test post with custom tag.</p><!-- /wp:paragraph -->',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<customparagraph>This is a test post with custom tag.', $content );
	}
}
