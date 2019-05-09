import React from 'react';
import { shallow } from 'enzyme';
import Button from './';

describe( 'Button', () => {
	describe( 'basic rendering', () => {
		it( 'should render a Button element with a value of "Continue"', () => {
			const button = shallow( <Button isPrimary>Continue</Button> );
			expect( button.render().hasClass( 'newspack-button' ) ).toBe( true );
		} );
	} );
	describe( 'rendering primary', () => {
		it( 'should render a Button element with a class of is-primary', () => {
			const button = shallow( <Button isPrimary>Continue</Button> );
			expect( button.render().hasClass( 'is-primary' ) ).toBe( true );
		} );
	} );
} );
