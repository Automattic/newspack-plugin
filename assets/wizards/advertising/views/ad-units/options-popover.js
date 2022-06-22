/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Button, Popover } from '../../../../components/src';

const OptionsPopover = props => {
	const [ isVisible, setIsVisible ] = useState( false );
	const toggleVisible = () => {
		setIsVisible( state => ! state );
	};
	const { deleteLink, editLink } = props;

	return (
		<>
			<Button
				className={ isVisible && 'popover-active' }
				onClick={ toggleVisible }
				icon={ moreVertical }
				label={ __( 'More options', 'newspack' ) }
				tooltipPosition="bottom center"
			/>
			{ isVisible && (
				<Popover
					position="bottom left"
					onFocusOutside={ toggleVisible }
					onKeyDown={ event => ESCAPE === event.keyCode && toggleVisible }
				>
					<MenuItem onClick={ toggleVisible } className="screen-reader-text">
						{ __( 'Close Popover', 'newspack' ) }
					</MenuItem>
					<MenuItem href={ editLink } className="newspack-button" isLink>
						{ __( 'Edit', 'newspack' ) }
					</MenuItem>
					<MenuItem onClick={ deleteLink } className="newspack-button">
						{ __( 'Archive', 'newspack' ) }
					</MenuItem>
				</Popover>
			) }
		</>
	);
};

export default OptionsPopover;
