/**
 * WordPress dependencies
 */
import { ColorPaletteControl } from '@wordpress/block-editor';
import { ColorIndicator, MenuItem } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Popover from '../popover';
import hooks from '../hooks';

function ColorControl( { label, onChange, value } ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => setIsVisible( state => ! state );
	const id = hooks.useUniqueId( 'color-controls__control' );

	return (
		<>
			<MenuItem
				className={ isVisible ? 'is-active' : '' }
				icon={ <ColorIndicator colorValue={ value } /> }
				iconPosition="left"
				onClick={ toggleVisible }
				id={ id }
			>
				{ label }
			</MenuItem>
			{ isVisible && (
				<Popover
					onFocusOutside={ event => {
						if ( event.relatedTarget?.id !== id ) {
							toggleVisible();
						}
					} }
					onKeyDown={ event => isVisible && ESCAPE === event.keyCode && toggleVisible() }
					offset={ 36 }
					placement="left-end"
				>
					<ColorPaletteControl label={ label } value={ value } onChange={ onChange } />
				</Popover>
			) }
		</>
	);
}

export default ColorControl;
