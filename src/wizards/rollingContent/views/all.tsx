/**
 * Rolling Content — All view (DataViews).
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { published, scheduled, archive } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { DataViews, Wizard } from '../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../packages/components/src/wizard/store';
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

const STATUS_ICONS: Record< RollingContentStatus, JSX.Element > = {
	active: published,
	archived: archive,
	scheduled,
};

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 20,
	sort: { field: 'date', direction: 'desc' },
	search: '',
	fields: [ 'date', 'entries_count', 'last_updated', 'status' ],
	filters: [],
	layout: {},
	titleField: 'title',
	mediaField: 'featured_image',
};

function AllRollingContent() {
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ data, setData ] = useState< RollingContent[] >( ROLLING_CONTENTS );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ managingEntriesFor, setManagingEntriesFor ] = useState< RollingContent | null >( null );
	const [ addingEntryFor, setAddingEntryFor ] = useState< RollingContent | null >( null );

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
				id: 'entries_count',
				label: __( 'Entries', 'newspack-plugin' ),
				getValue: ( { item } ) => item.entries.length,
				render: ( { item } ) => (
					<div style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
						<span>{ item.entries.length }</span>
						<Button variant="secondary" size="small" onClick={ () => setManagingEntriesFor( item ) }>
							{ __( 'Manage', 'newspack-plugin' ) }
						</Button>
						<Button variant="secondary" size="small" onClick={ () => setAddingEntryFor( item ) }>
							{ __( 'Add', 'newspack-plugin' ) }
						</Button>
					</div>
				),
			},
			{
				id: 'last_updated',
				label: __( 'Last updated', 'newspack-plugin' ),
				getValue: ( { item } ) => {
					if ( item.entries.length === 0 ) {
						return '';
					}
					return Math.max( ...item.entries.map( e => new Date( e.date ).getTime() ) );
				},
				render: ( { item } ) => {
					if ( item.entries.length === 0 ) {
						return '—';
					}
					const ms = Math.max( ...item.entries.map( e => new Date( e.date ).getTime() ) );
					return new Date( ms ).toLocaleDateString( undefined, {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
					} );
				},
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				getValue: ( { item } ) => item.status,
				render: ( { item } ) => <StatusPill status={ item.status } labels={ STATUS_LABELS } icons={ STATUS_ICONS } />,
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
			{ managingEntriesFor && (
				<ManageEntriesModal
					parent={ managingEntriesFor }
					entries={ managingEntriesFor.entries }
					onEntriesChange={ nextEntries =>
						setData( prev => prev.map( r => ( r.id === managingEntriesFor.id ? { ...r, entries: nextEntries } : r ) ) )
					}
					onClose={ () => setManagingEntriesFor( null ) }
				/>
			) }
			{ addingEntryFor && <AddEntryInfoModal parentTitle={ addingEntryFor.title } onClose={ () => setAddingEntryFor( null ) } /> }
		</>
	);
}

export default function All() {
	return (
		<Wizard
			headerText={ __( 'Newspack', 'newspack-plugin' ) }
			sections={ [ { path: '/', render: () => <AllRollingContent />, fullWidth: true } ] }
		/>
	);
}
