/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise */
/**
 * L0 — Subscriber list (DataViews, full-width).
 */

/**
 * WordPress dependencies.
 */
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import { dateI18n, getSettings } from '@wordpress/date';
import { __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis

const fmtDate = date => ( date ? dateI18n( getSettings().formats.date, date ) : '' );

/**
 * Internal dependencies.
 */
import { Badge, DataViews, Router } from '../../../../packages/components/src';
import './style.scss';
import { SUBSCRIBERS, DIGITAL_PLANS, PRINT_PLANS, ALL_TAGS, NEWSLETTERS } from '../data/mock-subscribers';

const { useHistory } = Router;

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

const ALL_PLAN_NAMES = [ ...DIGITAL_PLANS, ...PRINT_PLANS ].map( p => p.name );

const DEFAULT_VIEW = {
	type: 'table',
	page: 1,
	perPage: 20,
	sort: { field: 'lastPayment', direction: 'desc' },
	search: '',
	fields: [ 'status', 'plans', 'lastPayment', 'memberSince' ],
	filters: [],
	layout: {},
	titleField: 'name',
};

export default function SubscriberList() {
	const history = useHistory();
	const [ view, setView ] = useState( DEFAULT_VIEW );

	const openProfile = id => history.push( `/profile/${ id }` );

	const fields = useMemo(
		() => [
			{
				id: 'name',
				label: __( 'Subscriber', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item } ) => `${ item.name } ${ item.email }`,
				render: ( { item } ) => (
					<div>
						<div>{ item.name }</div>
						<div className="newspack-subscribers-demo__email">{ item.email }</div>
					</div>
				),
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				elements: Object.entries( STATUS_LABELS ).map( ( [ value, label ] ) => ( { value, label } ) ),
				filterBy: { operators: [ 'isAny' ] },
				getValue: ( { item } ) => item.status,
				render: ( { item } ) => <Badge level={ STATUS_BADGE_LEVEL[ item.status ] } text={ STATUS_LABELS[ item.status ] } />,
			},
			{
				id: 'plans',
				label: __( 'Plan', 'newspack-plugin' ),
				elements: ALL_PLAN_NAMES.map( n => ( { value: n, label: n } ) ),
				filterBy: { operators: [ 'isAny' ] },
				getValue: ( { item } ) => item.subscriptions.map( s => s.plan ).join( ', ' ),
				render: ( { item } ) => (
					<div>
						{ item.subscriptions.map( s => (
							<div key={ s.id }>{ s.plan }</div>
						) ) }
					</div>
				),
				enableSorting: false,
			},
			{
				id: 'lastPayment',
				label: __( 'Last payment', 'newspack-plugin' ),
				getValue: ( { item } ) => item.lastPayment,
				render: ( { item } ) => <span>{ fmtDate( item.lastPayment ) }</span>,
			},
			{
				id: 'memberSince',
				label: __( 'Member since', 'newspack-plugin' ),
				getValue: ( { item } ) => item.memberSince,
				render: ( { item } ) => <span>{ fmtDate( item.memberSince ) }</span>,
			},
			{
				id: 'tags',
				label: __( 'Tags', 'newspack-plugin' ),
				elements: ALL_TAGS.map( t => ( { value: t, label: t } ) ),
				filterBy: { operators: [ 'isAny' ] },
				getValue: ( { item } ) => ( item.tags || [] ).join( ', ' ),
				render: ( { item } ) => (
					<HStack spacing={ 1 } justify="flex-start" wrap>
						{ ( item.tags || [] ).map( t => (
							<Badge key={ t } text={ t } />
						) ) }
					</HStack>
				),
				enableSorting: false,
			},
			{
				id: 'newsletters',
				label: __( 'Newsletters', 'newspack-plugin' ),
				elements: NEWSLETTERS.map( n => ( { value: n.id, label: n.name } ) ),
				filterBy: { operators: [ 'isAny' ] },
				getValue: ( { item } ) =>
					( item.newsletters || [] )
						.map( id => NEWSLETTERS.find( n => n.id === id )?.name )
						.filter( Boolean )
						.join( ', ' ),
				render: ( { item } ) => (
					<div>
						{ ( item.newsletters || [] )
							.map( id => NEWSLETTERS.find( n => n.id === id )?.name )
							.filter( Boolean )
							.join( ', ' ) }
					</div>
				),
				enableSorting: false,
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'view-profile',
				label: __( 'View profile', 'newspack-plugin' ),
				isPrimary: true,
				callback: items => openProfile( items[ 0 ].id ),
			},
		],
		[]
	);

	const { data: processedData, paginationInfo } = useMemo( () => filterSortAndPaginate( SUBSCRIBERS, view, fields ), [ view, fields ] );

	return (
		<DataViews
			data={ processedData }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			actions={ actions }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: {} } }
			getItemId={ item => item.id }
			onClickItem={ item => openProfile( item.id ) }
			search
		/>
	);
}
