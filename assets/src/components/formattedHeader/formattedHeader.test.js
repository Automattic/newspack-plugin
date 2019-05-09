import React from 'react';
import { shallow } from 'enzyme';
import FormattedHeader from './';

describe( 'FormattedHeader', () => {
	describe( 'basic rendering', () => {
		it( 'should render a FormattedHeader element with a subheader', () => {
			const header = shallow( <FormattedHeader headerText="header text" subHeaderText="subheader text" /> );
			expect( header.hasClass( 'muriel-formatted-header' ) ).toBe( true );
			expect( header.hasClass( 'has-subheader' ) ).toBe( true );
			expect( header.find( '.muriel-formatted-header__subtitle' ) ).toHaveLength( 1 );
		} );

		it( 'should render a FormattedHeader element with no subheader', () => {
			const header = shallow( <FormattedHeader headerText="header text" /> );
			expect( header.hasClass( 'muriel-formatted-header' ) ).toBe( true );
			expect( header.hasClass( 'has-subheader' ) ).toBe( false );
			expect( header.find( '.muriel-formatted-header__subtitle' ) ).toHaveLength( 0 );
		} );
	} );
} );
