/**
 * Muriel-styled Select dropdown.
 */

/**
 * WordPress dependencies
 */
import { withFocusOutside } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
		 * Handles component onChange; also executes the props' onChange handler (the parent's original onChange).
		 */
		handleOnChange = ( onChange, value ) => {
			if (typeof onChange === 'function' ) {
				onChange( value );
			}
			this.setState( { isFocused: false } );
		};

		/**
		 * Handle component onClick; also executes the props' onChange handler (the parent's original onClick).
		 */
		handleOnClick = onClick => {
			this.setState( { isFocused: true } );
			if (typeof onClick === 'function' ) {
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
			const { value, disabled, className, onClick, onChange, label, options = [], ...otherProps } = this.props;
			const isEmpty = ! value;
			const isActive = isFocused && ! disabled;
			const classes = murielClassnames( "muriel-select", this.getClassName( disabled, isEmpty, isActive ), className );
			const displayLabel = ! isActive || disabled;
			const optionsFull = [
				{
					value: '',
					disabled: true,
					selected: isEmpty ? true : false,
					label: __( '- Select -' )
				},
				...options
			];

			return (
				<div
					className={ classes }
					onClick={ () => this.handleOnClick( onClick ) }
				>
					<select
						value={ value }
						disabled={ !! disabled }
						onChange={ value => this.handleOnChange( onChange, value ) }
						{ ...otherProps }
					>
						{ optionsFull.map( ( option, index ) =>
							<option
								key={ `${ option.label }-${ option.value }-${ index }` }
								value={ option.value }
								selected={ option.selected }
								disabled={ option.disabled }
							>
								{ option.label }
							</option>
						) }
					</select>
					<label
						hidden={ ! displayLabel }
					>
						{ label }
					</label>
				</div>
			);
		}
	}
);

export default SelectControl;
