/**
 * WordPress dependencies.
 */
import { ColorPicker as ColorPickerComponent } from '@wordpress/components';
import { useState, useRef } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { Icon, chevronDown } from '@wordpress/icons';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import hooks from '../hooks';
import './style.scss';

const InteractiveDiv = ( { style = {}, ...props } ) => (
	<div
		tabIndex="0"
		role="button"
		onKeyDown={ event => ENTER === event.keyCode && props.onClick() }
		style={ { cursor: 'pointer', ...style } }
		{ ...props }
	/>
);

const ColorPicker = ( { label, color = '#fff', onChange, className } ) => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const ref = useRef();
	hooks.useOnClickOutside( ref, () => setIsExpanded( false ) );
	return (
		<div className={ classnames( 'newspack-color-picker', className ) }>
			<div className="newspack-color-picker__label">{ label }</div>
			<div className="newspack-color-picker__main" ref={ ref }>
				<InteractiveDiv
					className={ classnames( 'newspack-color-picker__expander', {
						'newspack-color-picker__expander--expanded': isExpanded,
					} ) }
					onClick={ () => setIsExpanded( ! isExpanded ) }
				>
					<div>
						<div
							className="newspack-color-picker__indicator"
							style={ { backgroundColor: color } }
						/>
						<div>{ color }</div>
					</div>
					<Icon
						icon={ chevronDown }
						size={ 24 }
						style={ isExpanded ? { transform: 'rotate(180deg)' } : {} }
					/>
				</InteractiveDiv>
				{ isExpanded && (
					<ColorPickerComponent
						color={ color }
						onChangeComplete={ ( { hex } ) => onChange( hex ) }
						disableAlpha
					/>
				) }
			</div>
		</div>
	);
};

export default ColorPicker;
