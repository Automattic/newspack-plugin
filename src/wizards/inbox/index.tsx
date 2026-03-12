/**
 * Newspack Inbox — Static Prototype
 */

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import initialConversations, { Conversation } from './demo-data';

const intentClassMap: Record< string, string > = {
	'Refund Request': 'newspack-inbox__intent--refund-request',
	'Login Issue': 'newspack-inbox__intent--login-issue',
	'Billing Issue': 'newspack-inbox__intent--billing-issue',
	'Comp Request': 'newspack-inbox__intent--comp-request',
	Complaint: 'newspack-inbox__intent--complaint',
	Retention: 'newspack-inbox__intent--retention',
	'Access Issue': 'newspack-inbox__intent--access-issue',
};

function ConversationList( {
	items,
	selectedId,
	readIds,
	onSelect,
}: {
	items: Conversation[];
	selectedId: string | null;
	readIds: Set< string >;
	onSelect: ( id: string ) => void;
} ) {
	return (
		<div className="newspack-inbox__conversation-list">
			<div className="newspack-inbox__conversation-list-header">
				{ __( 'Inbox', 'newspack-plugin' ) }
			</div>
			{ items.map( item => {
				const isSelected = item.id === selectedId;
				const isRead = readIds.has( item.id );
				const classNames = [
					'newspack-inbox__conversation-item',
					isSelected && 'newspack-inbox__conversation-item--selected',
					! isRead && 'newspack-inbox__conversation-item--unread',
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
								{ ! isRead && (
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

function Thread( {
	conversation,
	actionStates,
	onToggleAction,
}: {
	conversation: Conversation | null;
	actionStates: Record< string, boolean >;
	onToggleAction: ( label: string ) => void;
} ) {
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
			<div className="newspack-inbox__thread-body">
				{ conversation.messages.map( message => (
					<div key={ message.id } className="newspack-inbox__message-group">
						<div className="newspack-inbox__message">
							<div className="newspack-inbox__message-header">
								<span className="newspack-inbox__message-from">
									{ message.from }
								</span>
								<span>{ message.date }</span>
							</div>
							<div className="newspack-inbox__message-body">{ message.body }</div>
						</div>
						{ message.aiAssessment && (
							<div
								className={ `newspack-inbox__ai-assessment newspack-inbox__ai-assessment--${ message.aiAssessment.status }` }
							>
								<span className="newspack-inbox__ai-assessment-label">
									{ message.aiAssessment.status === 'verified'
										? __( 'Verified', 'newspack-plugin' )
										: __( 'Discrepancy', 'newspack-plugin' ) }
								</span>
								{ message.aiAssessment.body }
							</div>
						) }
					</div>
				) ) }

				<div className="newspack-inbox__reply-area">
					<div className="newspack-inbox__reply-label">
						{ __( 'Draft reply', 'newspack-plugin' ) }
					</div>
					<textarea
						defaultValue={ conversation.draftReply }
						key={ conversation.id }
					/>
					<div className="newspack-inbox__reply-footer">
						{ conversation.actions.length > 0 && (
							<div className="newspack-inbox__reply-actions">
								{ conversation.actions.map( action => (
									<label key={ action.label } className="newspack-inbox__reply-action">
										<input
											type="checkbox"
											checked={ actionStates[ action.label ] ?? action.checked }
											onChange={ () => onToggleAction( action.label ) }
										/>
										<span>{ action.label }</span>
									</label>
								) ) }
							</div>
						) }
						<button className="newspack-inbox__send-button" type="button">
							{ conversation.actions.some(
								a => actionStates[ a.label ] ?? a.checked
							)
								? __( 'Send reply & perform actions', 'newspack-plugin' )
								: __( 'Send reply', 'newspack-plugin' ) }
						</button>
					</div>
				</div>
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
		</div>
	);
}

export default function Inbox() {
	const [ selectedId, setSelectedId ] = useState< string | null >(
		initialConversations[ 0 ]?.id || null
	);
	const [ readIds, setReadIds ] = useState< Set< string > >( () => new Set() );
	const [ actionStates, setActionStates ] = useState< Record< string, Record< string, boolean > > >( {} );

	const handleSelect = useCallback( ( id: string ) => {
		setSelectedId( id );
		setReadIds( prev => {
			if ( prev.has( id ) ) {
				return prev;
			}
			const next = new Set( prev );
			next.add( id );
			return next;
		} );
	}, [] );

	const selected = initialConversations.find( c => c.id === selectedId ) || null;

	const currentActionStates = selectedId ? ( actionStates[ selectedId ] || {} ) : {};

	const handleToggleAction = useCallback(
		( label: string ) => {
			if ( ! selectedId || ! selected ) {
				return;
			}
			setActionStates( prev => {
				const convActions = prev[ selectedId ] || {};
				const defaultChecked =
					selected.actions.find( a => a.label === label )?.checked ?? true;
				const current = convActions[ label ] ?? defaultChecked;
				return {
					...prev,
					[ selectedId ]: {
						...convActions,
						[ label ]: ! current,
					},
				};
			} );
		},
		[ selectedId, selected ]
	);

	return (
		<div className="newspack-inbox-layout">
			<ConversationList
				items={ initialConversations }
				selectedId={ selectedId }
				readIds={ readIds }
				onSelect={ handleSelect }
			/>
			<Thread
				conversation={ selected }
				actionStates={ currentActionStates }
				onToggleAction={ handleToggleAction }
			/>
			<ContextSidebar conversation={ selected } />
		</div>
	);
}
