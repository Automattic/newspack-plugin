import React from 'react';
import { shallow } from 'enzyme';
import Card from './';

describe( 'Card', () => {
	describe( 'basic rendering', () => {
		it( 'should render a Card element with only one class', () => {
			const card = shallow( <Card /> );
			expect( card.hasClass( 'muriel-card' ) ).toBe( true );
		} );
	} );
} );
