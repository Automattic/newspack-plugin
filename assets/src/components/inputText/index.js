/**
 * Muriel-styled Text/Number Input.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class InputText extends Component {
	/**
	 * Constructor.
	 */
 	constructor( props ) {
		super( props );
		const { label, value, disabled } = props;

		this.state = {
			label,
			value,
			disabled,
			isFocused: false
		};

		this.textInputRef = null;
		this.wrapperRef = null;
	};

	/**
	 * componentDidMount.
	 */
	componentDidMount() {
		document.addEventListener('mousedown', this.handleClickOutside);
	};

	/**
	 * componentWillUnmount.
	 */
	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleClickOutside);
	};

	/**
	 * Handle component onClick.
	 */
	handleOnClick = () => {
		this.setState({ isFocused: true });
		this.textInputRef.focus();
	};

	/**
	 * Handle clickOutside component.
	 */
	handleClickOutside = event => {
	  const { isFocused } = this.state;
		if ( this.wrapperRef && ! this.wrapperRef.contains(event.target) && isFocused ) {
			this.setState({ isFocused: false });
		}
	};

	/**
	 * Handle input value change.
	 */
	handleOnChange = event => {
		this.setState({ value: event.target.value});
	};

	/**
	 * Get input element's className depending on context.
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
		const { label, value, disabled, isFocused } = this.state;
		const isEmpty = ! value;
		const isActive = isFocused && ! disabled;
		const displayLabelDiv = ! isActive && ! isEmpty;
		const classNameInput = this.getTextInputClassName( disabled, isEmpty, isActive );

		return (
				<div
					className="newspack-input-text"
					onClick={ () => this.handleOnClick() }
					ref={ ( element ) => this.wrapperRef = element }
				>
						<input
							type="text"
							placeholder={ label }
							value={ value }
							className={ classNameInput }
							disabled={ disabled }
							onChange={ this.handleOnChange }
							ref={( element ) => this.textInputRef = element }
						/>
						<div
							className="div-label"
							hidden={ ! displayLabelDiv }
						>
							{ label }
						</div>
				</div>
		);
	};
}

export default InputText;
