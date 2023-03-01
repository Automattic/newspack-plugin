<?php
/**
 * Tests the AMP Polyfills.
 *
 * @package Newspack\Tests
 */

use Newspack\Polyfills;

/**
 * Tests the AMP Polyfills.
 */
class Amp_Polyfills extends WP_UnitTestCase {

	/**
	 * Data provider for test_image.
	 *
	 * @return array
	 */
	public function image_data() {
		return [
			[
				'<amp-img src="https://example.com/image.jpg" width="100" height="100"></amp-img>',
				'<img src="https://example.com/image.jpg" width="100" height="100"></img>',
			],
			[
				'<amp-img class="test" src="https://example.com/image.jpg" width="100" height="100"></amp-img>',
				'<img class="test" src="https://example.com/image.jpg" width="100" height="100"/>',
			],
			[
				'<amp-img src="https://example.com/image.jpg"></amp-img><p>something</p><amp-img src="https://example.com/image.jpg"></amp-img>something',
				'<img src="https://example.com/image.jpg"></img><p>something</p><img src="https://example.com/image.jpg"></img>something',
			],

		];
	}

	/**
	 * Tests the image polyfill.
	 *
	 * @param string $input Input content.
	 * @param string $expected Expected output.
	 * @return void
	 * @dataProvider image_data
	 */
	public function test_image( $input, $expected ) {
		$this->assertSame( $expected, Polyfills::amp_tags( $input ) );
	}

	/**
	 * Data provider for test_iframe.
	 *
	 * @return array
	 */
	public function iframe_data() {
		return [
			[
				'<amp-iframe src="https://example.com/image.jpg" width="100" height="100"></amp-iframe>',
				'<iframe src="https://example.com/image.jpg" width="100" height="100"></iframe>',
			],
			[
				'<amp-iframe class="test" src="https://example.com/image.jpg" width="100" height="100"></amp-iframe>',
				'<iframe class="test" src="https://example.com/image.jpg" width="100" height="100"></img>',
			],
			[
				'<amp-iframe src="https://example.com/image.jpg"></amp-iframe><p>something</p><amp-iframe src="https://example.com/image.jpg"></amp-iframe>something',
				'<iframe src="https://example.com/image.jpg"></iframe><p>something</p><iframe src="https://example.com/image.jpg"></iframe>something',
			],

		];
	}

	/**
	 * Tests the image polyfill.
	 *
	 * @param string $input Input content.
	 * @param string $expected Expected output.
	 * @return void
	 * @dataProvider iframe_data
	 */
	public function test_iframe( $input, $expected ) {
		$this->assertSame( $expected, Polyfills::amp_tags( $input ) );
	}

	/**
	 * Data provider for test_youtube.
	 *
	 * @return array
	 */
	public function test_youtube_data() {
		return [
			[
				'<amp-youtube data-videoid="mGENRKrdoGY" layout="responsive" width="480" height="270" ></amp-youtube>',
				'<div><!-- wp:embed {"url":"https://www.youtube.com/watch?v=mGENRKrdoGY","type":"video","providerNameSlug":"youtube","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} -->
                            <figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">
                            https://www.youtube.com/watch?v=mGENRKrdoGY
                            </div></figure>
                        <!-- /wp:embed --></div>',
			],

		];
	}

	/**
	 * Tests the image polyfill.
	 *
	 * @param string $input Input content.
	 * @param string $expected Expected output.
	 * @return void
	 * @dataProvider test_youtube_data
	 */
	public function test_youtube( $input, $expected ) {
		$this->assertSame( str_replace( ' ', '', $expected ), str_replace( ' ', '', Polyfills::amp_tags( $input ) ) );
	}

}
