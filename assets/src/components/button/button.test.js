import React from 'react';
import { shallow } from 'enzyme';
import NewspackButton from './';

describe( 'NewspackButton', () => {
	describe( 'basic rendering', () => {
		it( 'should render a NewspackButton element with a value of "Continue"', () => {
			const button = shallow( <NewspackButton isPrimary value="Continue" /> );
			expect( button.hasClass( 'is-primary' ) ).toBe( true );
		} );
	} );
} );
