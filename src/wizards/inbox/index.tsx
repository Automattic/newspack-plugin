/**
 * Newspack Inbox — Static Prototype
 */

/**
 * WordPress dependencies
 */
import { useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import initialConversations, { Conversation } from './demo-data';

type SendState = 'idle' | 'sending' | 'sent';

interface SentResult {
	replyText: string;
	actionsPerformed: string[];
}

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
	sentIds,
	onSelect,
}: {
	items: Conversation[];
	selectedId: string | null;
	readIds: Set< string >;
	sentIds: Set< string >;
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
				const isSent = sentIds.has( item.id );
				const classNames = [
					'newspack-inbox__conversation-item',
					isSelected && 'newspack-inbox__conversation-item--selected',
					! isRead && 'newspack-inbox__conversation-item--unread',
					isSent && 'newspack-inbox__conversation-item--sent',
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
								{ isSent
									? __( 'Replied', 'newspack-plugin' )
									: item.timestamp }
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
	sendState,
	sentResult,
	onToggleAction,
	onSend,
}: {
	conversation: Conversation | null;
	actionStates: Record< string, boolean >;
	sendState: SendState;
	sentResult: SentResult | null;
	onToggleAction: ( label: string ) => void;
	onSend: ( replyText: string ) => void;
} ) {
	const textareaRef = useRef< HTMLTextAreaElement >( null );

	if ( ! conversation ) {
		return (
			<div className="newspack-inbox__thread">
				<div className="newspack-inbox__thread-empty">
					{ __( 'Select a conversation to view', 'newspack-plugin' ) }
				</div>
			</div>
		);
	}

	const isSending = sendState === 'sending';
	const isSent = sendState === 'sent';
	const hasActiveActions = conversation.actions.some(
		a => actionStates[ a.label ] ?? a.checked
	);

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

				{ isSent && sentResult ? (
					<>
						<div className="newspack-inbox__message-group">
							<div className="newspack-inbox__message newspack-inbox__message--outbound">
								<div className="newspack-inbox__message-header">
									<span className="newspack-inbox__message-from">
										{ __( 'You', 'newspack-plugin' ) }
									</span>
									<span>{ __( 'Just now', 'newspack-plugin' ) }</span>
								</div>
								<div className="newspack-inbox__message-body">{ sentResult.replyText }</div>
							</div>
						</div>
						{ sentResult.actionsPerformed.length > 0 && (
							<div className="newspack-inbox__actions-log">
								{ sentResult.actionsPerformed.map( ( completedLabel, i ) => (
									<div
										key={ i }
										className="newspack-inbox__actions-log-item"
										dangerouslySetInnerHTML={ { __html: '&#10003; ' + completedLabel } }
									/>
								) ) }
							</div>
						) }
					</>
				) : (
					<div className={ `newspack-inbox__reply-area ${ isSending ? 'newspack-inbox__reply-area--sending' : '' }` }>
						<div className="newspack-inbox__reply-label">
							{ __( 'Draft reply', 'newspack-plugin' ) }
						</div>
						<textarea
							ref={ textareaRef }
							defaultValue={ conversation.draftReply }
							key={ conversation.id }
							disabled={ isSending }
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
												disabled={ isSending }
											/>
											<span>{ action.label }</span>
										</label>
									) ) }
								</div>
							) }
							<button
								className="newspack-inbox__send-button"
								type="button"
								disabled={ isSending }
								onClick={ () => onSend( textareaRef.current?.value || '' ) }
							>
								{ isSending
									? __( 'Sending…', 'newspack-plugin' )
									: hasActiveActions
										? __( 'Send reply & perform actions', 'newspack-plugin' )
										: __( 'Send reply', 'newspack-plugin' ) }
							</button>
						</div>
					</div>
				) }
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
	const [ sendStates, setSendStates ] = useState< Record< string, SendState > >( {} );
	const [ sentResults, setSentResults ] = useState< Record< string, SentResult > >( {} );

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
	const currentSendState: SendState = selectedId ? ( sendStates[ selectedId ] || 'idle' ) : 'idle';
	const currentSentResult = selectedId ? ( sentResults[ selectedId ] || null ) : null;

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

	const handleSend = useCallback( ( replyText: string ) => {
		if ( ! selectedId || ! selected ) {
			return;
		}
		const convActionStates = actionStates[ selectedId ] || {};
		const performedActions = selected.actions
			.filter( a => convActionStates[ a.label ] ?? a.checked )
			.map( a => a.completedLabel );

		setSendStates( prev => ( { ...prev, [ selectedId ]: 'sending' } ) );

		setTimeout( () => {
			setSendStates( prev => ( { ...prev, [ selectedId ]: 'sent' } ) );
			setSentResults( prev => ( {
				...prev,
				[ selectedId ]: { replyText, actionsPerformed: performedActions },
			} ) );
		}, 1200 );
	}, [ selectedId, selected, actionStates ] );

	const sentIds = new Set(
		Object.entries( sendStates )
			.filter( ( [ , state ] ) => state === 'sent' )
			.map( ( [ id ] ) => id )
	);

	return (
		<div className="newspack-inbox-layout">
			<ConversationList
				items={ initialConversations }
				selectedId={ selectedId }
				readIds={ readIds }
				sentIds={ sentIds }
				onSelect={ handleSelect }
			/>
			<Thread
				conversation={ selected }
				actionStates={ currentActionStates }
				sendState={ currentSendState }
				sentResult={ currentSentResult }
				onToggleAction={ handleToggleAction }
				onSend={ handleSend }
			/>
			<ContextSidebar conversation={ selected } />
		</div>
	);
}
