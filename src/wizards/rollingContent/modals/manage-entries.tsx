/**
 * Rolling Content demo — Manage Entries modal.
 *
 * Full-screen modal containing a nested DataViews of all entries belonging
 * to one parent Rolling Content. Reuses the shared Edit Info, Delete
 * Confirm, and Add Entry Info modals for row-level and toolbar actions.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { DataViews } from '../../../../packages/components/src';
import StatusPill from '../components/status-pill';
import EditInfoModal from './edit-info';
import DeleteConfirmModal from './delete-confirm';
import AddEntryInfoModal from './add-entry-info';

const STATUS_LABELS: Record< EntryStatus, string > = {
	published: __( 'Published', 'newspack-plugin' ),
	draft: __( 'Draft', 'newspack-plugin' ),
	scheduled: __( 'Scheduled', 'newspack-plugin' ),
};

const STATUS_COLORS: Record< EntryStatus, { bg: string; fg: string } > = {
	published: { bg: '#d1fae5', fg: '#065f46' },
	draft: { bg: '#e5e7eb', fg: '#374151' },
	scheduled: { bg: '#dbeafe', fg: '#1e40af' },
};

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 20,
	sort: { field: 'date', direction: 'desc' },
	search: '',
	fields: [ 'date', 'author', 'status', 'tags' ],
	filters: [],
	layout: {},
	titleField: 'title',
	mediaField: 'featured_image',
};

export default function ManageEntriesModal( {
	parent,
	entries,
	onEntriesChange,
	onClose,
}: {
	parent: RollingContent;
	entries: Entry[];
	onEntriesChange: ( next: Entry[] ) => void;
	onClose: () => void;
} ) {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ isAddingEntry, setIsAddingEntry ] = useState( false );

	const fields: Field< Entry >[] = useMemo(
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
				id: 'author',
				label: __( 'Author', 'newspack-plugin' ),
				getValue: ( { item } ) => item.author,
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				getValue: ( { item } ) => item.status,
				render: ( { item } ) => <StatusPill status={ item.status } labels={ STATUS_LABELS } colors={ STATUS_COLORS } />,
				elements: ( Object.keys( STATUS_LABELS ) as EntryStatus[] ).map( value => ( {
					value,
					label: STATUS_LABELS[ value ],
				} ) ),
			},
			{
				id: 'tags',
				label: __( 'Tags', 'newspack-plugin' ),
				getValue: ( { item } ) => item.tags.join( ', ' ),
				render: ( { item } ) => (
					<span style={ { display: 'inline-flex', gap: 4, flexWrap: 'wrap' } }>
						{ item.tags.map( tag => (
							<span
								key={ tag }
								style={ {
									background: '#f3f4f6',
									padding: '2px 8px',
									borderRadius: 4,
									fontSize: 12,
								} }
							>
								{ tag }
							</span>
						) ) }
					</span>
				),
				enableSorting: false,
			},
		],
		[]
	);

	const actions: Action< Entry >[] = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'newspack-plugin' ),
				isPrimary: true,
				supportsBulk: false,
				RenderModal: ( { items, closeModal } ) => <EditInfoModal itemType="entry" title={ items[ 0 ].title } onClose={ closeModal } />,
			},
			{
				id: 'delete',
				label: __( 'Delete', 'newspack-plugin' ),
				isDestructive: true,
				supportsBulk: false,
				RenderModal: ( { items, closeModal } ) => (
					<DeleteConfirmModal
						itemType="entry"
						title={ items[ 0 ].title }
						onConfirm={ () => onEntriesChange( entries.filter( e => e.id !== items[ 0 ].id ) ) }
						onClose={ closeModal }
					/>
				),
			},
		],
		[ entries, onEntriesChange ]
	);

	const { data: processedData, paginationInfo } = useMemo( () => filterSortAndPaginate( entries, view, fields ), [ entries, view, fields ] );

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: parent rolling content title. */
				__( 'Manage entries — %s', 'newspack-plugin' ),
				parent.title
			) }
			onRequestClose={ onClose }
			isFullScreen
		>
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 16,
				} }
			>
				<p style={ { margin: 0, color: '#6b7280' } }>
					{ sprintf(
						/* translators: %s: parent rolling content title. */
						__( 'Entries for: %s', 'newspack-plugin' ),
						parent.title
					) }
				</p>
				<Button variant="primary" onClick={ () => setIsAddingEntry( true ) }>
					{ __( 'Add New Entry', 'newspack-plugin' ) }
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
				getItemId={ ( item: Entry ) => String( item.id ) }
				search
			/>

			{ isAddingEntry && <AddEntryInfoModal parentTitle={ parent.title } onClose={ () => setIsAddingEntry( false ) } /> }
		</Modal>
	);
}
