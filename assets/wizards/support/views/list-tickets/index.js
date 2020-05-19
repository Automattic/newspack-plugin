/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { withWizardScreen, Waiting, Notice } from '../../../../components/src';
import withWPCOMAuth from '../../components/withWPCOMAuth';

const TICKET_PREFIX = '[Newspack] ';

/**
 * Tickets List screen.
 */
class ListTickets extends Component {
	state = { tickets: null, error: null };
	componentDidMount() {
		this.props
			.wizardApiFetch( {
				path: '/newspack/v1/wizard/newspack-support-wizard/support-history',
			} )
			.then( supportHistory =>
				this.setState( {
					tickets: supportHistory.filter( ( { type } ) => type === 'Zendesk_History' ),
				} )
			)
			.catch( error => this.setState( { error } ) );
	}
	render() {
		const { tickets = [], error } = this.state;

		if ( error ) {
			return <Notice isError noticeText={ error.message } />;
		}

		if ( this.state.tickets === null ) {
			return (
				<div className="newspack_support_loading">
					<Waiting />
				</div>
			);
		}

		const activeTickets = tickets.filter( ( { status } ) => status !== 'Closed' );
		const closedTickets = tickets.filter( ( { status } ) => status === 'Closed' );

		return (
			<div>
				<div className="newspack-ticket-list">
					<h2>{ __( 'Open tickets', 'newspack' ) }</h2>
					{ activeTickets.length ? (
						<div className="newspack-ticket-list__single">
							{ activeTickets.map( ticket => (
								<div key={ ticket.id }>
									{ ticket.subject.replace( TICKET_PREFIX, '' ) } <i>({ ticket.when })</i>
								</div>
							) ) }
						</div>
					) : (
						<i>{ __( 'No open tickets found.', 'newspack' ) }</i>
					) }
				</div>

				{ closedTickets.length > 0 ? (
					<details className="newspack-ticket-list">
						<summary>
							{ __( 'Closed tickets', 'newspack' ) } ({ closedTickets.length })
						</summary>

						<div className="newspack-ticket-list__single">
							{ closedTickets.map( ticket => (
								<div key={ ticket.id }>
									{ ticket.subject.replace( TICKET_PREFIX, '' ) } <i>({ ticket.when })</i>
								</div>
							) ) }
						</div>
					</details>
				) : null }
			</div>
		);
	}
}
export default withWizardScreen( withWPCOMAuth( ListTickets ) );
