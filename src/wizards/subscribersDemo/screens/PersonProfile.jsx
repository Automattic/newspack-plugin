/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * L1 — Person profile.
 *
 * Two-column grid layout (SectionHeader in the left column, content in
 * the right) modelled on Access Control > Add new content gate.
 * Alerts and Current Status are pinned above Identity when issues
 * exist, so the hierarchy concern from Katie (multiple subs + broken
 * membership) is handled.
 */

/**
 * WordPress dependencies.
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { dateI18n, getSettings } from '@wordpress/date';
import { __experimentalVStack as VStack, __experimentalHStack as HStack, Notice, Snackbar, ToggleControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis

/**
 * Internal dependencies.
 */
import { Badge, Button, Card, Divider, Grid, Router, SectionHeader } from '../../../../packages/components/src';
import './style.scss';
import { WIZARD_STORE_NAMESPACE } from '../../../../packages/components/src/wizard/store';
import {
	getSubscriberById,
	getStoredNotes,
	setStoredNotes,
	getStoredTags,
	setStoredTags,
	getStoredNewsletters,
	setStoredNewsletters,
	NEWSLETTERS,
} from '../data/mock-subscribers';

import visaIcon from '../assets/cards/visa.svg';
import mastercardIcon from '../assets/cards/mastercard.svg';
import amexIcon from '../assets/cards/amex.svg';
import discoverIcon from '../assets/cards/discover.svg';
import jcbIcon from '../assets/cards/jcb.svg';

const CARD_ICONS = {
	Visa: visaIcon,
	Mastercard: mastercardIcon,
	Amex: amexIcon,
	Discover: discoverIcon,
	JCB: jcbIcon,
};

import RefundFlow from '../flows/RefundFlow';
import ResubscribeFlow from '../flows/ResubscribeFlow';
import PlanChangeFlow from '../flows/PlanChangeFlow';
import PaymentUpdateFlow from '../flows/PaymentUpdateFlow';
import GuidedFixFlow from '../flows/GuidedFixFlow';
import NoteFlow from '../flows/NoteFlow';
import TagsFlow from '../flows/TagsFlow';

const { useParams } = Router;

const fmtDate = date => ( date ? dateI18n( getSettings().formats.date, date ) : '' );

const STATUS_LABELS = {
	active: __( 'Active', 'newspack-plugin' ),
	lapsed: __( 'Lapsed', 'newspack-plugin' ),
	cancelled: __( 'Cancelled', 'newspack-plugin' ),
};

const STATUS_BADGE_LEVEL = {
	active: 'success',
	lapsed: 'warning',
	cancelled: 'error',
};

function getStatusSummary( subscriber ) {
	if ( subscriber.status === 'active' ) {
		const activeSubs = subscriber.subscriptions.filter( s => s.status === 'active' );
		if ( activeSubs.length === 0 ) {
			return [ __( 'Active subscriber with no current plan on file', 'newspack-plugin' ) ];
		}
		if ( activeSubs.length > 1 ) {
			const names = activeSubs.map( s => s.plan ).join( ' and ' );
			const next = activeSubs
				.map( s => s.nextBillingDate )
				.filter( Boolean )
				.sort()[ 0 ];
			return [
				sprintf( __( 'Active subscriber on %s', 'newspack-plugin' ), names ),
				sprintf( __( 'Next billing %s', 'newspack-plugin' ), fmtDate( next ) ),
			];
		}
		const sub = activeSubs[ 0 ];
		return [
			sprintf( __( 'Active subscriber on %s', 'newspack-plugin' ), sub.plan ),
			sprintf( __( 'Next billing %s', 'newspack-plugin' ), fmtDate( sub.nextBillingDate ) ),
		];
	}
	if ( subscriber.status === 'lapsed' ) {
		return [ sprintf( __( 'Subscription lapsed — last payment on %s', 'newspack-plugin' ), fmtDate( subscriber.lastPayment ) ) ];
	}
	return [ __( 'Subscription cancelled — access has ended', 'newspack-plugin' ) ];
}

/**
 * Row of a two-column section: header on the left, children on the right.
 */
function Row( { title, description, children, showDivider = true } ) {
	return (
		<>
			<Grid columns={ 2 } gutter={ 32 }>
				<SectionHeader title={ title } description={ description } heading={ 2 } noMargin />
				<div>{ children }</div>
			</Grid>
			{ showDivider && <Divider alignment="full-width" variant="tertiary" /> }
		</>
	);
}

export default function PersonProfile() {
	const { id } = useParams();
	const initial = useMemo( () => {
		const found = getSubscriberById( id );
		if ( ! found ) {
			return found;
		}
		const storedTags = getStoredTags( id );
		const storedNewsletters = getStoredNewsletters( id );
		return {
			...found,
			notes: getStoredNotes( id ),
			tags: storedTags !== null ? storedTags : found.tags || [],
			newsletters: storedNewsletters !== null ? storedNewsletters : found.newsletters || [],
		};
	}, [ id ] );
	const [ subscriber, setSubscriber ] = useState( initial );

	useEffect( () => {
		if ( subscriber ) {
			setStoredNotes( subscriber.id, subscriber.notes || [] );
		}
	}, [ subscriber ] );

	useEffect( () => {
		if ( subscriber ) {
			setStoredTags( subscriber.id, subscriber.tags || [] );
		}
	}, [ subscriber ] );

	useEffect( () => {
		if ( subscriber ) {
			setStoredNewsletters( subscriber.id, subscriber.newsletters || [] );
		}
	}, [ subscriber ] );
	const [ flash, setFlash ] = useState( null );
	const [ snackbar, setSnackbar ] = useState( null );
	const [ modal, setModal ] = useState( null );

	useEffect( () => {
		setSubscriber( initial );
		setFlash( null );
		setSnackbar( null );
		setModal( null );
	}, [ id, initial ] );

	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	useEffect( () => {
		if ( ! subscriber ) {
			return;
		}
		setHeaderData( {
			backNav: '#/',
			sectionName: subscriber.name,
			sectionTitle: subscriber.name,
			badges: [ { label: STATUS_LABELS[ subscriber.status ], level: STATUS_BADGE_LEVEL[ subscriber.status ] } ],
			sectionDescription: (
				<VStack spacing={ 1 }>
					<span>{ subscriber.email }</span>
					{ getStatusSummary( subscriber ).map( ( line, i ) => (
						<span key={ i }>{ line }</span>
					) ) }
					{ ( subscriber.tags || [] ).length > 0 && (
						<HStack spacing={ 1 } justify="flex-start" wrap>
							{ subscriber.tags.map( t => (
								<Badge key={ t } text={ t } />
							) ) }
						</HStack>
					) }
				</VStack>
			),
			actions: [
				{ type: 'more', label: __( 'View in WooCommerce', 'newspack-plugin' ), action: () => {} },
				{ type: 'more', label: __( 'Edit WordPress user', 'newspack-plugin' ), action: () => {} },
				{ type: 'more', label: __( 'Manage tags', 'newspack-plugin' ), action: () => setModal( { kind: 'tags' } ) },
				{ type: 'more', label: __( 'Add private note', 'newspack-plugin' ), action: () => setModal( { kind: 'note' } ) },
				{ type: 'more', label: __( 'View raw subscription data', 'newspack-plugin' ), action: () => {} },
			],
		} );
	}, [ subscriber, setHeaderData ] );

	if ( ! subscriber ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ __( 'Subscriber not found.', 'newspack-plugin' ) }
			</Notice>
		);
	}

	const closeModal = () => setModal( null );
	const completeFlow = ( { type, message, mutate, transient } ) => {
		if ( mutate ) {
			setSubscriber( prev => mutate( prev ) );
		}
		if ( transient ) {
			setSnackbar( { message } );
		} else {
			setFlash( { type, message } );
		}
		setModal( null );
	};

	const hasAlerts = subscriber.alerts && subscriber.alerts.length > 0;

	return (
		<div className="newspack-subscribers-demo__profile">
			{ flash && (
				<Notice status={ flash.type === 'success' ? 'success' : 'error' } isDismissible={ false }>
					{ flash.message }
				</Notice>
			) }

			{ hasAlerts &&
				subscriber.alerts.map( alert => (
					<Notice
						key={ alert.id }
						status={ alert.level === 'error' ? 'error' : 'warning' }
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Fix this', 'newspack-plugin' ),
								onClick: () => setModal( { kind: 'guided', alert } ),
								variant: 'link',
							},
						] }
					>
						{ `${ alert.title }. ${ alert.message }` }
					</Notice>
				) ) }

			{ ( subscriber.notes || [] ).length > 0 && (
				<VStack spacing={ 2 }>
					{ subscriber.notes.map( note => (
						<Card key={ note.id } __experimentalCoreCard className="newspack-subscribers-demo__note-card">
							<VStack spacing={ 4 }>
								<div>{ note.text }</div>
								<HStack spacing={ 2 } justify="flex-start">
									<Button variant="tertiary" size="compact" onClick={ () => setModal( { kind: 'note', note } ) }>
										{ __( 'Edit', 'newspack-plugin' ) }
									</Button>
									<Button
										variant="tertiary"
										size="compact"
										isDestructive
										onClick={ () => {
											setSubscriber( prev => ( {
												...prev,
												notes: ( prev.notes || [] ).filter( n => n.id !== note.id ),
											} ) );
											setSnackbar( { message: __( 'Private note deleted.', 'newspack-plugin' ) } );
										} }
									>
										{ __( 'Delete', 'newspack-plugin' ) }
									</Button>
								</HStack>
							</VStack>
						</Card>
					) ) }
				</VStack>
			) }

			<Row title={ __( 'Subscriptions', 'newspack-plugin' ) }>
				<VStack spacing={ 4 }>
					{ subscriber.subscriptions.length === 0 ? (
						<Card __experimentalCoreCard>
							<p>{ __( 'No subscriptions on file.', 'newspack-plugin' ) }</p>
							<Button variant="primary" size="compact" onClick={ () => setModal( { kind: 'resubscribe' } ) }>
								{ __( 'Resubscribe', 'newspack-plugin' ) }
							</Button>
						</Card>
					) : (
						subscriber.subscriptions.map( sub => {
							const isActive = sub.status === 'active';
							return (
								<Card
									key={ sub.id }
									__experimentalCoreCard
									__experimentalCoreProps={ {
										header: (
											<HStack justify="space-between">
												<h4>{ sub.plan }</h4>
												<Badge level={ STATUS_BADGE_LEVEL[ sub.status ] } text={ STATUS_LABELS[ sub.status ] } />
											</HStack>
										),
									} }
								>
									<VStack spacing={ 4 }>
										<div>
											{ sub.access } · { sub.cadence } · ${ sub.amount.toFixed( 2 ) }
											{ isActive && sub.nextBillingDate && (
												<>
													<br />
													{ sprintf( __( 'Next billing %s', 'newspack-plugin' ), fmtDate( sub.nextBillingDate ) ) }
												</>
											) }
										</div>
										<HStack spacing={ 2 } justify="flex-start">
											{ isActive ? (
												<>
													<Button
														variant="secondary"
														size="compact"
														isDestructive
														onClick={ () => setModal( { kind: 'refund', subscription: sub } ) }
													>
														{ __( 'Refund / Cancel', 'newspack-plugin' ) }
													</Button>
													<Button
														variant="secondary"
														size="compact"
														onClick={ () => setModal( { kind: 'plan', subscription: sub } ) }
													>
														{ __( 'Change plan', 'newspack-plugin' ) }
													</Button>
												</>
											) : (
												<Button variant="primary" size="compact" onClick={ () => setModal( { kind: 'resubscribe' } ) }>
													{ __( 'Resubscribe', 'newspack-plugin' ) }
												</Button>
											) }
										</HStack>
									</VStack>
								</Card>
							);
						} )
					) }
				</VStack>
			</Row>

			<Row title={ __( 'Newsletters', 'newspack-plugin' ) } description={ __( 'Email lists this subscriber receives.', 'newspack-plugin' ) }>
				<Card __experimentalCoreCard>
					<VStack spacing={ 4 }>
						{ NEWSLETTERS.map( newsletter => {
							const isSubscribed = ( subscriber.newsletters || [] ).includes( newsletter.id );
							return (
								<HStack key={ newsletter.id } justify="space-between" alignment="center">
									<VStack spacing={ 1 }>
										<strong>{ newsletter.name }</strong>
										<span>{ newsletter.description }</span>
									</VStack>
									<ToggleControl
										checked={ isSubscribed }
										onChange={ () => {
											const nextList = isSubscribed
												? ( subscriber.newsletters || [] ).filter( i => i !== newsletter.id )
												: [ ...( subscriber.newsletters || [] ), newsletter.id ];
											setSubscriber( prev => ( { ...prev, newsletters: nextList } ) );
											setSnackbar( {
												message: isSubscribed
													? sprintf( __( 'Unsubscribed from %s.', 'newspack-plugin' ), newsletter.name )
													: sprintf( __( 'Subscribed to %s.', 'newspack-plugin' ), newsletter.name ),
											} );
										} }
										__nextHasNoMarginBottom
									/>
								</HStack>
							);
						} ) }
					</VStack>
				</Card>
			</Row>

			<Row title={ __( 'Payment methods', 'newspack-plugin' ) }>
				<VStack spacing={ 4 }>
					{ subscriber.paymentMethods.length === 0 ? (
						<Card __experimentalCoreCard>
							<VStack spacing={ 4 }>
								<div>{ __( 'No payment method on file.', 'newspack-plugin' ) }</div>
								<HStack justify="flex-start">
									<Button variant="primary" size="compact" onClick={ () => setModal( { kind: 'payment' } ) }>
										{ __( 'Add payment method', 'newspack-plugin' ) }
									</Button>
								</HStack>
							</VStack>
						</Card>
					) : (
						<>
							{ subscriber.paymentMethods.map( pm => (
								<Card
									key={ pm.id }
									__experimentalCoreCard
									__experimentalCoreProps={ {
										header: (
											<HStack justify="space-between">
												<HStack spacing={ 2 } justify="flex-start">
													{ CARD_ICONS[ pm.type ] && (
														<img
															src={ CARD_ICONS[ pm.type ] }
															alt={ pm.type }
															className="newspack-subscribers-demo__card-icon"
														/>
													) }
													<h4>
														{ pm.type } ···· { pm.last4 }
													</h4>
												</HStack>
												{ pm.isDefault && <Badge level="info" text={ __( 'Default', 'newspack-plugin' ) } /> }
											</HStack>
										),
									} }
								>
									<HStack justify="space-between">
										<div>{ sprintf( __( 'Expires %s', 'newspack-plugin' ), pm.expiry ) }</div>
										<HStack spacing={ 2 } justify="flex-end">
											<Button
												variant="tertiary"
												size="compact"
												onClick={ () => setModal( { kind: 'payment', paymentMethod: pm } ) }
											>
												{ __( 'Update', 'newspack-plugin' ) }
											</Button>
											{ ! pm.isDefault && (
												<>
													<Button
														variant="tertiary"
														size="compact"
														onClick={ () =>
															setSubscriber( prev => ( {
																...prev,
																paymentMethods: prev.paymentMethods.map( m => ( {
																	...m,
																	isDefault: m.id === pm.id,
																} ) ),
															} ) )
														}
													>
														{ __( 'Make default', 'newspack-plugin' ) }
													</Button>
													<Button
														variant="tertiary"
														size="compact"
														isDestructive
														onClick={ () =>
															setSubscriber( prev => ( {
																...prev,
																paymentMethods: prev.paymentMethods.filter( m => m.id !== pm.id ),
															} ) )
														}
													>
														{ __( 'Remove', 'newspack-plugin' ) }
													</Button>
												</>
											) }
										</HStack>
									</HStack>
								</Card>
							) ) }
							<HStack justify="flex-start">
								<Button variant="secondary" size="compact" onClick={ () => setModal( { kind: 'payment' } ) }>
									{ __( 'Add payment method', 'newspack-plugin' ) }
								</Button>
							</HStack>
						</>
					) }
				</VStack>
			</Row>

			<SectionHeader heading={ 2 } title={ __( 'Order and refund history', 'newspack-plugin' ) } />
			<div className="dataviews-wrapper newspack-subscribers-demo__orders-wrapper">
				<table className="dataviews-view-table">
					<thead>
						<tr>
							<th>{ __( 'Date', 'newspack-plugin' ) }</th>
							<th>{ __( 'Type', 'newspack-plugin' ) }</th>
							<th className="dataviews-view-table__actions-column">{ __( 'Amount', 'newspack-plugin' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ subscriber.orders.map( o => (
							<tr key={ o.id }>
								<td>{ fmtDate( o.date ) }</td>
								<td>{ o.type }</td>
								<td className="dataviews-view-table__actions-column">${ o.amount.toFixed( 2 ) }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>

			{ modal?.kind === 'refund' && <RefundFlow subscription={ modal.subscription } onClose={ closeModal } onComplete={ completeFlow } /> }
			{ modal?.kind === 'plan' && <PlanChangeFlow subscription={ modal.subscription } onClose={ closeModal } onComplete={ completeFlow } /> }
			{ modal?.kind === 'resubscribe' && <ResubscribeFlow subscriber={ subscriber } onClose={ closeModal } onComplete={ completeFlow } /> }
			{ modal?.kind === 'payment' && <PaymentUpdateFlow onClose={ closeModal } onComplete={ completeFlow } /> }
			{ snackbar && (
				<div className="newspack-subscribers-demo__snackbar">
					<Snackbar onRemove={ () => setSnackbar( null ) }>{ snackbar.message }</Snackbar>
				</div>
			) }

			{ modal?.kind === 'note' && <NoteFlow note={ modal.note } onClose={ closeModal } onComplete={ completeFlow } /> }
			{ modal?.kind === 'tags' && <TagsFlow tags={ subscriber.tags || [] } onClose={ closeModal } onComplete={ completeFlow } /> }
			{ modal?.kind === 'guided' && (
				<GuidedFixFlow
					alert={ modal.alert }
					subscriber={ subscriber }
					onClose={ closeModal }
					onComplete={ completeFlow }
					onOpenPaymentUpdate={ () => setModal( { kind: 'payment' } ) }
				/>
			) }
		</div>
	);
}
