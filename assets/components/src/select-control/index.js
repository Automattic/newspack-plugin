/**
 * Muriel-styled Select dropdown.
 */

/**
 * WordPress dependencies
 */
import { withFocusOutside } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * WordPress transitional dependency: using a locally modified copy, until `@wordpress/components` updates the the SelectControl
 * and implements the `disabled` attribute of its options.
 *      PR 15976: https://github.com/WordPress/gutenberg/pull/15976
 */
import BaseComponent from './wordpress-components-select-control-modified.js';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';
import './style.scss';

const SelectControl = withFocusOutside(
	class extends Component {
		/**
		 * Constructor.
		 */
		constructor( props ) {
			super( props );
			this.state = {
				isFocused: false,
			};
		}

		/**
		 * A `withFocusOutside` HOC's default handler.
		 */
		handleFocusOutside() {
			this.setState( { isFocused: false } );
		}

		/**
		 * Handles component onChange; also executes the props' onChange handler (the parent's original onChange).
		 */
		handleOnChange = ( onChange, value ) => {
			if ( typeof onChange === 'function' ) {
				onChange( value );
			}
			this.setState( { isFocused: false } );
		};

		/**
		 * Handle component onClick; also executes the props' onChange handler (the parent's original onClick).
		 */
		handleOnClick = onClick => {
			this.setState( { isFocused: true } );
			if ( typeof onClick === 'function' ) {
				onClick();
			}
		};

		/**
		 * Get component's className describing its state.
		 */
		getClassName = ( disabled, isEmpty, isActive ) => {
			let className = 'with-value';
			if ( disabled ) {
				className = 'disabled';
			} else if ( isActive ) {
				className = 'active';
			} else if ( isEmpty ) {
				className = 'empty';
			}

			return className;
		};

		/**
		 * Render.
		 */
		render() {
			const { isFocused } = this.state;
			const { value, disabled, className, onClick, onChange, ...otherProps } = this.props;
			const isEmpty = ! value;
			const isActive = isFocused && ! disabled;
			const classes = murielClassnames(
				'muriel-select',
				this.getClassName( disabled, isEmpty, isActive ),
				className
			);

			return (
				<BaseComponent
					value={ value }
					disabled={ !! disabled }
					className={ classes }
					onClick={ () => this.handleOnClick( onClick ) }
					onChange={ value => this.handleOnChange( onChange, value ) }
					{ ...otherProps }
				/>
			);
		}
	}
);

export default SelectControl;
