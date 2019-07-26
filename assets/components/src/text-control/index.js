/**
 * Muriel-styled Text/Number Input.
 */

/**
 * WordPress dependencies
 */
import { TextControl as BaseComponent, withFocusOutside } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';
import './style.scss';

const TextControl = withFocusOutside(

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
		 * Handle component onClick; also executes the props' onChange handler (the parent's original onClick).
		 */
		handleOnClick = ( onClick ) => {
			this.setState( { isFocused: true } );
			if (typeof onClick === "function") {
				onClick();
			}
		};

		/**
		 * Get component's className describing its state.
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
			const { className, onClick, ...otherProps } = this.props;
			const { label, value, disabled } = otherProps;
			const isEmpty = '' === value;
			const isActive = isFocused && ! disabled;

			return (
				<BaseComponent
					className={ murielClassnames( "muriel-input-text", className, this.getClassName( disabled, isEmpty, isActive ) ) }
					placeholder={ label }
					onClick={ () => this.handleOnClick( onClick ) }
					{ ...otherProps }
				/>
			);
		}
	}
);

export default TextControl;
