/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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

const Accordion = ( { children } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<details
			className={ classNames( 'newspack-accordion', { 'newspack-accordion--is-open': isOpen } ) }
		>
			<summary onClick={ () => setIsOpen( ! isOpen ) }>
				{ __( 'Webhooks not connected to this site.', 'newspack' ) }
				<Icon className="newspack-accordion__icon" icon={ chevronDown } size={ 24 } />
			</summary>
			{ children }
		</details>
	);
};

export default Accordion;
