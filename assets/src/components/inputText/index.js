/**
 * Muriel-styled Text/Number Input.
 */

/**
 * WordPress dependencies
 */
import { TextControl, withFocusOutside } from '@wordpress/components';
import { Component } from '@wordpress/element';
import './style.scss';

const InputText = withFocusOutside(

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
		 * A `withFocusOutside`'s default function, handler for the focus outside the component event.
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
		 * Get a component's className describing its state.
		 */
		getClassName = ( disabled, isEmpty, isActive ) => {
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
			const { isFocused } = this.state;
			const { label, value, disabled } = this.props;
			const isEmpty = ! value;
			const isActive = isFocused && ! disabled;
			const className= this.getClassName( disabled, isEmpty, isActive );

			return (
				<TextControl
					className={ "newspack-input-text " + className }
					placeholder={ label }
					{ ...this.props }
					onClick={ () => this.handleOnClick() }
				/>
			);
		}
	}
);

export default InputText;
