import React from 'react';
import { render } from '@testing-library/react';

import ImageUpload from './';

describe( 'ImageUpload', () => {
	it( 'should render an add image button', () => {
		const { getByText } = render( <ImageUpload /> );
		expect( getByText( 'Upload' ) ).toBeInTheDocument();
	} );
} );
