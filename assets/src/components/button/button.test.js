import React from 'react';
import { shallow } from 'enzyme';
import Button from './';

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a Button element with a value of "Continue"', () => {
			const button = shallow( <Button isPrimary>Continue</Button> );
			expect( button.hasClass( 'newspack-button' ) ).toBe( true );
		} );
	} );
} );
