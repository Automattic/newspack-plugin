import React from 'react';
import { shallow } from 'enzyme';
import ProgressBar from './';

describe( 'ProgressBar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a ProgressBar element with no labels', () => {
			const bar = shallow( <ProgressBar completed="1" total="2" /> );
			expect( bar.hasClass( 'muriel-progress-bar' ) ).toBe( true );
			expect( bar.find( '.muriel-progress-bar__label' ) ).toHaveLength( 0 );
			expect( bar.find( '.muriel-progress-bar__fraction' ) ).toHaveLength( 0 );
		} );

		it( 'should render a ProgressBar element with a label', () => {
			const bar = shallow( <ProgressBar completed="1" total="2" label="test label" /> );
			expect( bar.hasClass( 'muriel-progress-bar' ) ).toBe( true );
			expect( bar.find( '.muriel-progress-bar__label' ) ).toHaveLength( 1 );
			expect( bar.find( '.muriel-progress-bar__fraction' ) ).toHaveLength( 0 );
		} );

		it( 'should render a ProgressBar element with a fraction', () => {
			const bar = shallow( <ProgressBar completed="1" total="2" displayFraction /> );
			expect( bar.hasClass( 'muriel-progress-bar' ) ).toBe( true );
			expect( bar.find( '.muriel-progress-bar__label' ) ).toHaveLength( 0 );
			expect( bar.find( '.muriel-progress-bar__fraction' ) ).toHaveLength( 1 );
		} );

		it( 'should render a ProgressBar element with both label and fraction', () => {
			const bar = shallow( <ProgressBar completed="1" total="2" label="test label" displayFraction /> );
			expect( bar.hasClass( 'muriel-progress-bar' ) ).toBe( true );
			expect( bar.find( '.muriel-progress-bar__label' ) ).toHaveLength( 1 );
			expect( bar.find( '.muriel-progress-bar__fraction' ) ).toHaveLength( 1 );
		} );

		it( 'should render a ProgressBar element with appropriate progress', () => {
			const bar = shallow( <ProgressBar completed="1" total="2" /> );
			expect( bar.find( '.muriel-progress-bar__bar' ).render().css( 'width' ) ).toBe( '50%' );
		} );
	} );
} );
