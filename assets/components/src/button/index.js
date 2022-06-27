/**
 * Button
 */

/**
 * WordPress dependencies.
 */
import { Button as BaseComponent } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Router from '../proxied-imports/router';
import './style.scss';

const { useHistory } = Router;

const Button = ( { href, onClick = () => {}, ...otherProps } ) => {
	const history = useHistory();
	const [ isAwaitingOnClick, setIsAwaitingOnClick ] = useState( false );

	// If both onClick and href are present, await the onClick action an then redirect.
	if ( href && onClick ) {
		otherProps.onClick = async () => {
			setIsAwaitingOnClick( true );
			await onClick();
			setIsAwaitingOnClick( false );
			history.push( href.replace( '#', '' ) );
		};
	} else {
		otherProps.href = href;
		otherProps.onClick = onClick;
	}
	if ( isAwaitingOnClick ) {
		otherProps.disabled = true;
	}
	return <BaseComponent { ...otherProps } />;
};

export default Button;
