/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import { Wizard } from '../../../../components/src';
import withWPCOMAuth from '../../components/withWPCOMAuth';

const TICKET_PREFIX = '[Newspack Support] ';

const TicketsSection = ( { isCollapsible, isHiddenIfEmpty, title, tickets } ) => {
	if ( isHiddenIfEmpty && tickets.length === 0 ) {
		return null;
	}
	const ticketsList = tickets.map( ticket => (
		<div key={ ticket.id }>
			{ ticket.subject.replace( TICKET_PREFIX, '' ) } <i>({ ticket.when })</i>
		</div>
	) );
	return isCollapsible ? (
		<details className="newspack-ticket-list">
			<summary>
				{ title } ({ tickets.length })
			</summary>

			<div className="newspack-ticket-list__single">{ ticketsList }</div>
		</details>
	) : (
		<div className="newspack-ticket-list">
			<h2>{ title }</h2>
			{ tickets.length ? (
				<div className="newspack-ticket-list__single">{ ticketsList }</div>
			) : (
				<i>{ __( 'No tickets found.', 'newspack' ) }</i>
			) }
		</div>
	);
};

const ListTickets = () => {
	const [ tickets, setTickets ] = useState( null );

	const { wizardApiFetch } = useDispatch( Wizard.STORE_NAMESPACE );

	useEffect( () => {
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-support-wizard/support-history',
		} ).then( supportHistory =>
			setTickets( supportHistory.filter( ( { type } ) => type === 'Zendesk_History' ) )
		);
	}, [] );

	if ( tickets === null ) {
		return null;
	}

	const actionRequiredTickets = tickets.filter( ( { status } ) => status === 'Pending' );
	// Zendesk ticket statuses: "New", "Open", "Pending", "Hold", "Solved", "Closed"
	const onHoldTickets = tickets.filter( ( { status } ) => status === 'Hold' );
	const activeTickets = tickets.filter( ( { status } ) => status === 'New' || status === 'Open' );
	const closedTickets = tickets.filter(
		( { status } ) => status === 'Closed' || status === 'Solved'
	);

	return (
		<div>
			<TicketsSection
				title={ __( 'Action required', 'newspack' ) }
				tickets={ actionRequiredTickets }
				isHiddenIfEmpty
			/>
			<TicketsSection title={ __( 'Open tickets', 'newspack' ) } tickets={ activeTickets } />
			<TicketsSection
				title={ __( 'Tickets on hold', 'newspack' ) }
				tickets={ onHoldTickets }
				isHiddenIfEmpty
			/>
			<TicketsSection
				title={ __( 'Closed tickets', 'newspack' ) }
				tickets={ closedTickets }
				isCollapsible
			/>
		</div>
	);
};
export default withWPCOMAuth( ListTickets );
