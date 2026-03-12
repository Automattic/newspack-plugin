/**
 * Newspack Inbox — Static Prototype
 */

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import conversations, { Conversation } from './demo-data';

const intentClassMap: Record< string, string > = {
	'Refund Request': 'newspack-inbox__intent--refund-request',
	'Login Issue': 'newspack-inbox__intent--login-issue',
	'Billing Issue': 'newspack-inbox__intent--billing-issue',
	'Comp Request': 'newspack-inbox__intent--comp-request',
	Complaint: 'newspack-inbox__intent--complaint',
};

function ConversationList( {
	items,
	selectedId,
	onSelect,
}: {
	items: Conversation[];
	selectedId: string | null;
	onSelect: ( id: string ) => void;
} ) {
	return (
		<div className="newspack-inbox__conversation-list">
			<div className="newspack-inbox__conversation-list-header">
				{ __( 'Inbox', 'newspack-plugin' ) }
			</div>
			{ items.map( item => {
				const isSelected = item.id === selectedId;
				const classNames = [
					'newspack-inbox__conversation-item',
					isSelected && 'newspack-inbox__conversation-item--selected',
					! item.read && 'newspack-inbox__conversation-item--unread',
				]
					.filter( Boolean )
					.join( ' ' );
				return (
					<div
						key={ item.id }
						className={ classNames }
						onClick={ () => onSelect( item.id ) }
						onKeyDown={ e => {
							if ( e.key === 'Enter' || e.key === ' ' ) {
								onSelect( item.id );
							}
						} }
						role="button"
						tabIndex={ 0 }
					>
						<div className="newspack-inbox__conversation-item-top-row">
							<span className="newspack-inbox__conversation-item-sender">
								{ ! item.read && (
									<span className="newspack-inbox__conversation-item-unread-dot" />
								) }
								{ item.senderName }
							</span>
							<span className="newspack-inbox__conversation-item-time">
								{ item.timestamp }
							</span>
						</div>
						<div className="newspack-inbox__conversation-item-subject">
							{ item.subject }
						</div>
						<span
							className={ `newspack-inbox__conversation-item-intent ${ intentClassMap[ item.intentLabel ] || '' }` }
						>
							{ item.intentLabel }
						</span>
					</div>
				);
			} ) }
		</div>
	);
}

function Thread( { conversation }: { conversation: Conversation | null } ) {
	if ( ! conversation ) {
		return (
			<div className="newspack-inbox__thread">
				<div className="newspack-inbox__thread-empty">
					{ __( 'Select a conversation to view', 'newspack-plugin' ) }
				</div>
			</div>
		);
	}
	return (
		<div className="newspack-inbox__thread">
			<div className="newspack-inbox__thread-header">
				<h2>{ conversation.subject }</h2>
				<span>{ conversation.senderName } &lt;{ conversation.senderEmail }&gt;</span>
			</div>
			<div className="newspack-inbox__thread-messages">
				{ conversation.messages.map( message => (
					<div key={ message.id } className="newspack-inbox__message">
						<div className="newspack-inbox__message-header">
							<span className="newspack-inbox__message-from">
								{ message.from }
							</span>
							<span>{ message.date }</span>
						</div>
						<div className="newspack-inbox__message-body">{ message.body }</div>
					</div>
				) ) }
			</div>
			<div className="newspack-inbox__reply-area">
				<textarea placeholder={ __( 'Write a reply…', 'newspack-plugin' ) } />
			</div>
		</div>
	);
}

function ContextSidebar( { conversation }: { conversation: Conversation | null } ) {
	if ( ! conversation ) {
		return (
			<div className="newspack-inbox__sidebar">
				<div className="newspack-inbox__sidebar-empty">
					{ __( 'No conversation selected', 'newspack-plugin' ) }
				</div>
			</div>
		);
	}
	return (
		<div className="newspack-inbox__sidebar">
			{ conversation.contextPanels.map( panel => (
				<div key={ panel.heading } className="newspack-inbox__context-panel">
					<div className="newspack-inbox__context-panel-heading">{ panel.heading }</div>
					{ Object.entries( panel.fields ).map( ( [ label, value ] ) => (
						<div key={ label } className="newspack-inbox__context-panel-field">
							<span className="newspack-inbox__context-panel-field-label">
								{ label }
							</span>
							<span className="newspack-inbox__context-panel-field-value">
								{ value }
							</span>
						</div>
					) ) }
				</div>
			) ) }
			<div className="newspack-inbox__actions">
				<div className="newspack-inbox__actions-heading">
					{ __( 'Suggested Actions', 'newspack-plugin' ) }
				</div>
				{ conversation.suggestedActions.map( action => (
					<button
						key={ action.label }
						className={ `newspack-inbox__action-button newspack-inbox__action-button--${ action.variant }` }
						type="button"
					>
						{ action.label }
					</button>
				) ) }
			</div>
		</div>
	);
}

export default function Inbox() {
	const [ selectedId, setSelectedId ] = useState< string | null >( conversations[ 0 ]?.id || null );
	const selected = conversations.find( c => c.id === selectedId ) || null;

	return (
		<div className="newspack-inbox-layout">
			<ConversationList
				items={ conversations }
				selectedId={ selectedId }
				onSelect={ setSelectedId }
			/>
			<Thread conversation={ selected } />
			<ContextSidebar conversation={ selected } />
		</div>
	);
}
