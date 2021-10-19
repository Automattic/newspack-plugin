/**
 * Text Control
 */

/**
 * WordPress dependencies
 */
import { TextControl as BaseComponent } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

class TextControl extends Component {
	constructor( props ) {
		super( props );
		this.wrapperRef = createRef();
	}
	componentDidMount() {
		if ( this.wrapperRef.current ) {
			const labelEl = this.wrapperRef.current.querySelector( 'label' );
			if ( labelEl ) {
				labelEl.setAttribute( 'data-required-text', __( '(required)', 'newspack' ) );
			}
		}
	}
	/**
	 * Render.
	 */
	render() {
		const { className, required, isSmall, isWide, withMargin = true, ...otherProps } = this.props;
		const classes = classNames(
			'newspack-text-control',
			{ 'newspack-text-control--small': isSmall },
			{ 'newspack-text-control--wide': isWide },
			{ 'newspack-text-control--with-margin': withMargin },
			className
		);
		return required ? (
			<div ref={ this.wrapperRef } className="newspack-text-control--required">
				<BaseComponent className={ classes } required={ required } { ...otherProps } />
			</div>
		) : (
			<BaseComponent className={ classes } { ...otherProps } />
		);
	}
}

export default TextControl;
