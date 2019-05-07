/**
 * Muriel-styled Text/Number Input.
 */

/**
 * WordPress dependencies
 */
import { TextControl, withFocusOutside } from '@wordpress/components';
import { Component } from '@wordpress/element';

const InputText = withFocusOutside(
	class extends Component {
		/**
		 * Constructor.
		 */
		constructor( props ) {
			super( props  );
			this.state = {
				value: props.value,
				isFocused: false
			};
		};

		/**
		 * withFocusOutside: handles component onClick.
		 */
		handleFocusOutside() {
			this.setState( { isFocused: false } );
		}

		/**
		 * Handle component onClick.
		 */
		handleOnClick = () => {
			this.setState( { isFocused: true } );
		};

		/**
		 * Handle component onChange.
		 */
		handleOnChange = value => {
			this.setState( { value } );
		};

		/**
		 * Get component's className depending on state and context.
		 */
		getTextInputClassName = ( disabled, isEmpty, isActive ) => {
			let className = "with-value";
			if ( disabled ) {
				className = "disabled";
			} else if ( isEmpty ) {
				className = "empty";
			} else if ( isActive ) {
				className = "active";
			}

			return className;
		};

		/**
		 * Render.
		 */
		render() {
			const { value, isFocused } = this.state;
			const { label, disabled } = this.props;
			const isEmpty = ! value;
			const isActive = isFocused && ! disabled;
			const classNameInput= this.getTextInputClassName( disabled, isEmpty, isActive );

			return (
				<TextControl
					className={ "newspack-input-text " + classNameInput }
					placeholder={ label }
					{ ...this.props }
					value={ value }
					onClick={ () => this.handleOnClick() }
					onChange={ this.handleOnChange }
				/>
			);
		}
	}
);

export default InputText;
