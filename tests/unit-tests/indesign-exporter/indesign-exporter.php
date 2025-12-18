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
	 * Test converting pullquotes.
	 */
	public function test_convert_pullquote() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<blockquote><p>A pullquote content</p><cite>John Doe</cite></blockquote>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:pullquote>A pullquote content', $content );
		$this->assertStringContainsString( '<pstyle:pullquotename>John Doe', $content );
	}

	/**
	 * Test converting blockquotes.
	 */
	public function test_convert_blockquote() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<blockquote class="wp-block-quote">This is a blockquote.</blockquote>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:blockquote>This is a blockquote.', $content );
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
				'post_content' => '<figure class="wp-block-image size-large"><img src="http://localhost/image.jpg" alt="" class="wp-image-1234"/><figcaption class="wp-element-caption">My Caption <span class="image-credit"><span class="credit-label-wrapper">Credit:</span> <a href="http://localhost/credit">My Credit</a></span></figcaption></figure>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringNotContainsString( '<figure', $content );
		$this->assertStringNotContainsString( '<figcaption', $content );
		$this->assertStringNotContainsString( '<img', $content );
	}

	/**
	 * Test image processing.
	 */
	public function test_image_processing() {
		$thumbnail_id = $this->factory->attachment->create();
		wp_update_post(
			[
				'ID'           => $thumbnail_id,
				'post_excerpt' => 'Featured Image Caption',
			]
		);
		update_post_meta( $thumbnail_id, '_media_credit', 'Featured Image Credit' );

		$image_id = $this->factory->attachment->create();
		wp_update_post(
			[
				'ID'           => $image_id,
				'post_excerpt' => 'Image Caption',
			]
		);
		update_post_meta( $image_id, '_media_credit', 'Image Credit' );

		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<!-- wp:image {"id":' . $image_id . '} --><!-- /wp:image -->',
			]
		);
		update_post_meta( $post_id, '_thumbnail_id', $thumbnail_id );

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:PhotoCaption>Featured Image Caption', $content );
		$this->assertStringContainsString( '<pstyle:PhotoCredit>Featured Image Credit', $content );
		$this->assertStringContainsString( '<pstyle:PhotoCaption>Image Caption', $content );
		$this->assertStringContainsString( '<pstyle:PhotoCredit>Image Credit', $content );
	}

	/**
	 * Test image with custom caption.
	 */
	public function test_image_with_custom_caption() {
		$image_id = $this->factory->attachment->create();
		wp_update_post(
			[
				'ID'           => $image_id,
				'post_excerpt' => 'Image Caption',
			]
		);

		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<!-- wp:image {"id":' . $image_id . '} --><figure class="wp-block-image"><img src="http://localhost/wp-content/uploads/2025/01/image.jpg" /><figcaption class="wp-element-caption">Custom Caption</figcaption></figure><!-- /wp:image -->',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:PhotoCaption>Custom Caption', $content );
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

	/**
	 * Test headings.
	 */
	public function test_convert_headings() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><h4>Heading 4</h4><h5>Heading 5</h5><h6>Heading 6</h6>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:h1>Heading 1', $content );
		$this->assertStringContainsString( '<pstyle:h2>Heading 2', $content );
		$this->assertStringContainsString( '<pstyle:h3>Heading 3', $content );
		$this->assertStringContainsString( '<pstyle:h4>Heading 4', $content );
		$this->assertStringContainsString( '<pstyle:h5>Heading 5', $content );
		$this->assertStringContainsString( '<pstyle:h6>Heading 6', $content );
	}

	/**
	 * Test horizontal rule.
	 */
	public function test_convert_horizontal_rule() {
		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<hr>',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:hr>', $content );
	}

	/**
	 * Test image caption and credit special characters.
	 */
	public function test_image_caption_and_credit_special_characters() {
		$image_id = $this->factory->attachment->create();
		wp_update_post(
			[
				'ID'           => $image_id,
				'post_excerpt' => 'Image Caption with á é í ó ú ñ ç ð ð &nbsp;, &amp;, &lt;, &gt; and •.',
			]
		);
		update_post_meta( $image_id, '_media_credit', 'Image Credit with á é í ó ú ñ ç ð ð &nbsp;, &amp;, &lt;, &gt; and •.' );

		$post_id = $this->factory->post->create(
			[
				'post_title'   => 'Test Post',
				'post_content' => '<!-- wp:image {"id":' . $image_id . '} --><figure class="wp-block-image"><img src="http://localhost/wp-content/uploads/2025/01/image.jpg" /><figcaption class="wp-element-caption">Image Caption with á é í ó ú ñ ç ð ð &nbsp;, &amp;, &lt;, &gt; and •.</figcaption></figure><!-- /wp:image -->',
			]
		);

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $post_id );
		$this->assertStringContainsString( '<pstyle:PhotoCaption>Image Caption with <0x00E1> <0x00E9> <0x00ED> <0x00F3> <0x00FA> <0x00F1> <0x00E7> <0x00F0> <0x00F0>  , &, <, > and <CharStyle:bullet>n<CharStyle:>.', $content );
		$this->assertStringContainsString( '<pstyle:PhotoCredit>Image Credit with <0x00E1> <0x00E9> <0x00ED> <0x00F3> <0x00FA> <0x00F1> <0x00E7> <0x00F0> <0x00F0>  , &, <, > and <CharStyle:bullet>n<CharStyle:>.', $content );
	}
}
