/**
 * Settings Wizard: Connections > Webhooks > Endpoint Actions
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { moreVertical } from '@wordpress/icons';
import { useState, useEffect, Fragment } from '@wordpress/element';
import { Tooltip, Button, Popover, MenuItem } from '@wordpress/components';

function EndpointActions( {
	endpoint,
	disabled = undefined,
	position = 'bottom left',
	isSystem,
	setAction,
}: {
	endpoint: Endpoint;
	disabled?: boolean;
	isSystem: string;
	position?: Tooltip.Props[ 'position' ] | undefined;
	setAction: ( action: WebhookActions, id: number | string ) => void;
} ) {
	const [ popoverVisible, setPopoverVisible ] = useState( false );

	useEffect( () => {
		setPopoverVisible( false );
	}, [ disabled ] );

	return (
		<Fragment>
			<Button
				className={ popoverVisible ? 'popover-active' : '' }
				onClick={ () => setPopoverVisible( ! popoverVisible ) }
				icon={ moreVertical }
				disabled={ disabled }
				label={ __( 'Endpoint Actions', 'newspack-plugin' ) }
				tooltipPosition={ position }
			/>
			{ popoverVisible && (
				<Popover
					position={ position }
					onFocusOutside={ () => setPopoverVisible( false ) }
					onKeyDown={ event => ESCAPE === event.keyCode && setPopoverVisible( false ) }
				>
					<MenuItem onClick={ () => setPopoverVisible( false ) } className="screen-reader-text">
						{ __( 'Close Endpoint Actions', 'newspack-plugin' ) }
					</MenuItem>
					<MenuItem onClick={ () => setAction( 'view', endpoint.id ) } className="newspack-button">
						{ __( 'View Requests', 'newspack-plugin' ) }
					</MenuItem>
					{ ! isSystem && (
						<MenuItem
							onClick={ () => setAction( 'edit', endpoint.id ) }
							className="newspack-button"
						>
							{ __( 'Edit', 'newspack-plugin' ) }
						</MenuItem>
					) }
					{ ! isSystem && (
						<MenuItem
							onClick={ () => setAction( 'delete', endpoint.id ) }
							className="newspack-button"
							isDestructive
						>
							{ __( 'Remove', 'newspack-plugin' ) }
						</MenuItem>
					) }
				</Popover>
			) }
		</Fragment>
	);
}

export default EndpointActions;
