/**
 * Muriel-styled Select dropdown.
 */

/**
 * WordPress dependencies
 */
import { SelectControl as BaseComponent, withFocusOutside } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

const SelectControl = withFocusOutside(

	class extends Component {

		/**
		 * Constructor.
		 */
		constructor( props ) {
			super( props  );
			this.state = {
				isFocused: false
			};
		};

		/**
		 * A `withFocusOutside` HOC's default handler.
		 */
		handleFocusOutside() {
			this.setState( { isFocused: false } );
		};

		/**
		 * Handles component onChange; also executes the props' onChange handler (the parent's original handler).
		 */
		handleOnChange = ( onChange, value ) => {
			onChange( value );
			this.setState( { isFocused: false } );
		};

		/**
		 * Handle component onClick.
		 */
		handleOnClick = () => {
			this.setState( { isFocused: true } );
		};

		/**
		 * Get component's className describing its state.
		 */
		getClassName = ( disabled, isEmpty, isActive ) => {
			let className = "with-value";
			if ( disabled ) {
				className = "disabled";
			} else if ( isActive ) {
				className = "active";
			} else if ( isEmpty ) {
				className = "empty";
			}

			return className;
		};

		/**
		 * Render.
		 */
		render() {
			const { isFocused } = this.state;
			const { label, value, disabled, onChange } = this.props;
			const isEmpty = ! value;
			const isActive = isFocused && ! disabled;
			const className= this.getClassName( disabled, isEmpty, isActive );

			return (
				<BaseComponent
					className={ "newspack-select " + className }
					{ ...this.props }
					onClick={ () => this.handleOnClick() }
					onChange={ value => this.handleOnChange( onChange, value ) }
				/>
			);
		}
	}
);

export default SelectControl;
