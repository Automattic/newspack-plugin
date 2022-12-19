/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, chevronDown } from '@wordpress/icons';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

const Accordion = ( { children, title } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<details
			className={ classNames( 'newspack-accordion', { 'newspack-accordion--is-open': isOpen } ) }
		>
			<summary onClick={ () => setIsOpen( ! isOpen ) }>
				{ title }
				<Icon className="newspack-accordion__icon" icon={ chevronDown } size={ 24 } />
			</summary>
			{ children }
		</details>
	);
};

export default Accordion;
