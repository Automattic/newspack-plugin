import React from 'react';
import { shallow } from 'enzyme';
import ImageUpload from './';

describe( 'ImageUpload', () => {
	describe( 'basic rendering', () => {
		it( 'should render an image uploader ready for upload', () => {
			const uploader = shallow( <ImageUpload /> );
			expect( uploader.hasClass( 'newspack-image-upload' ) ).toBe( true );
			expect( uploader.hasClass( 'no-image' ) ).toBe( true );
		} );

		it( 'should render an image uploader prepopulated with an upload', () => {
			const uploader = shallow( <ImageUpload image_id="1234" image_url="https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg" /> );
			expect( uploader.hasClass( 'newspack-image-upload' ) ).toBe( true );
			expect( uploader.hasClass( 'has-image' ) ).toBe( true );
		} );
	} );
} );
