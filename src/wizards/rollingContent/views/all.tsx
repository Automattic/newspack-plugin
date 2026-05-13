/**
 * Rolling Content — All view (DataViews).
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { DataViews } from '../../../../packages/components/src';
import { ROLLING_CONTENTS } from '../data';
import StatusPill from '../components/status-pill';
import EditInfoModal from '../modals/edit-info';
import DeleteConfirmModal from '../modals/delete-confirm';
import AddEntryInfoModal from '../modals/add-entry-info';
import ManageEntriesModal from '../modals/manage-entries';

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
	const [ data, setData ] = useState< RollingContent[] >( ROLLING_CONTENTS );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

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
				render: ( { item } ) => <StatusPill status={ item.status } labels={ STATUS_LABELS } colors={ STATUS_COLORS } />,
				elements: ( Object.keys( STATUS_LABELS ) as RollingContentStatus[] ).map( value => ( {
					value,
					label: STATUS_LABELS[ value ],
				} ) ),
			},
		],
		[]
	);

	const actions: Action< RollingContent >[] = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'newspack-plugin' ),
				isPrimary: true,
				supportsBulk: false,
				RenderModal: ( { items, closeModal }: { items: RollingContent[]; closeModal: () => void } ) => (
					<EditInfoModal itemType="rolling-content" title={ items[ 0 ].title } onClose={ closeModal } />
				),
			},
			{
				id: 'manage-entries',
				label: __( 'Manage Entries', 'newspack-plugin' ),
				supportsBulk: false,
				modalSize: 'fill',
				RenderModal: ( { items, closeModal }: { items: RollingContent[]; closeModal: () => void } ) => {
					const parent = items[ 0 ];
					return (
						<ManageEntriesModal
							parent={ parent }
							entries={ parent.entries }
							onEntriesChange={ nextEntries =>
								setData( prev => prev.map( r => ( r.id === parent.id ? { ...r, entries: nextEntries } : r ) ) )
							}
							onClose={ closeModal }
						/>
					);
				},
			},
			{
				id: 'add-entry',
				label: __( 'Add New Entry', 'newspack-plugin' ),
				supportsBulk: false,
				RenderModal: ( { items, closeModal }: { items: RollingContent[]; closeModal: () => void } ) => (
					<AddEntryInfoModal parentTitle={ items[ 0 ].title } onClose={ closeModal } />
				),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'newspack-plugin' ),
				isDestructive: true,
				supportsBulk: false,
				RenderModal: ( { items, closeModal }: { items: RollingContent[]; closeModal: () => void } ) => (
					<DeleteConfirmModal
						itemType="rolling-content"
						title={ items[ 0 ].title }
						onConfirm={ () => setData( prev => prev.filter( r => r.id !== items[ 0 ].id ) ) }
						onClose={ closeModal }
					/>
				),
			},
		],
		[]
	);

	const { data: processedData, paginationInfo } = useMemo( () => filterSortAndPaginate( data, view, fields ), [ data, view, fields ] );

	return (
		<>
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 16,
				} }
			>
				<h2 style={ { margin: 0 } }>{ __( 'Rolling Content', 'newspack-plugin' ) }</h2>
				<Button variant="primary" href="admin.php?page=newspack-rolling-content-add">
					{ __( 'Add Rolling Content', 'newspack-plugin' ) }
				</Button>
			</div>
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
		</>
	);
}
