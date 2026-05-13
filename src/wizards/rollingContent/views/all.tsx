/**
 * Rolling Content — All view (DataViews).
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { DataViews } from '../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../packages/components/src/wizard/store';
import { ROLLING_CONTENTS } from '../data';

const STATUS_LABELS: Record< RollingContentStatus, string > = {
	active: __( 'Active', 'newspack-plugin' ),
	archived: __( 'Archived', 'newspack-plugin' ),
	scheduled: __( 'Scheduled', 'newspack-plugin' ),
};

const STATUS_COLORS: Record< RollingContentStatus, { bg: string; fg: string } > = {
	active: { bg: '#d1fae5', fg: '#065f46' },
	archived: { bg: '#e5e7eb', fg: '#374151' },
	scheduled: { bg: '#dbeafe', fg: '#1e40af' },
};

function StatusPill( { status }: { status: RollingContentStatus } ) {
	const c = STATUS_COLORS[ status ];
	return (
		<span
			style={ {
				background: c.bg,
				color: c.fg,
				padding: '2px 10px',
				borderRadius: 999,
				fontSize: 12,
				fontWeight: 500,
				textTransform: 'capitalize',
			} }
		>
			{ STATUS_LABELS[ status ] }
		</span>
	);
}

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 20,
	sort: { field: 'date', direction: 'desc' },
	search: '',
	fields: [ 'date', 'status' ],
	filters: [],
	layout: {},
	titleField: 'title',
	mediaField: 'featured_image',
};

export default function All() {
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ data, setData ] = useState< RollingContent[] >( ROLLING_CONTENTS );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	useEffect( () => {
		setHeaderData( {
			sectionName: __( 'Rolling Content', 'newspack-plugin' ),
			actions: [
				{
					type: 'primary',
					label: __( 'Add Rolling Content', 'newspack-plugin' ),
					href: 'admin.php?page=newspack-rolling-content-add',
				},
			],
		} );
	}, [ setHeaderData ] );

	const fields: Field< RollingContent >[] = useMemo(
		() => [
			{
				id: 'featured_image',
				label: __( 'Featured image', 'newspack-plugin' ),
				type: 'media',
				render: ( { item } ) => <img src={ item.featuredImage } alt={ item.title } style={ { maxWidth: 80 } } />,
				enableSorting: false,
			},
			{
				id: 'title',
				label: __( 'Title', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => <strong>{ item.title }</strong>,
			},
			{
				id: 'date',
				label: __( 'Date', 'newspack-plugin' ),
				getValue: ( { item } ) => item.date,
				render: ( { item } ) =>
					new Date( item.date ).toLocaleDateString( undefined, {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
					} ),
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				getValue: ( { item } ) => item.status,
				render: ( { item } ) => <StatusPill status={ item.status } />,
				elements: ( Object.keys( STATUS_LABELS ) as RollingContentStatus[] ).map( value => ( {
					value,
					label: STATUS_LABELS[ value ],
				} ) ),
			},
		],
		[]
	);

	const actions: Action< RollingContent >[] = useMemo( () => [], [] );

	const { data: processedData, paginationInfo } = useMemo( () => filterSortAndPaginate( data, view, fields ), [ data, view, fields ] );

	return (
		<DataViews
			data={ processedData }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			actions={ actions }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: {} } }
			getItemId={ ( item: RollingContent ) => String( item.id ) }
			search
		/>
	);
}
