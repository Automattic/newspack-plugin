/**
 * Institutions list view using DataViews.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import type { Action, Field, View } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { DataViews, Router } from '../../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../../packages/components/src/wizard/store';
import './style.scss';

const { useHistory } = Router;

const API_PATH = '/wp/v2/np_institution';

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 25,
	sort: { field: 'name', direction: 'asc' },
	search: '',
	fields: [ 'email_domain', 'ip_range', 'reader_data' ],
	filters: [],
	layout: {},
	titleField: 'title',
	descriptionField: 'description',
};

export default function Institutions() {
	const history = useHistory();
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ data, setData ] = useState< Institution[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	useEffect( () => {
		setHeaderData( {
			sectionName: __( 'Institutions', 'newspack-plugin' ),
			actions: [
				{
					type: 'secondary',
					label: __( '\u2190 Back to Access control', 'newspack-plugin' ),
					icon: null,
					href: '#/content-gates',
				},
				{
					type: 'primary',
					label: __( 'Add New Institution', 'newspack-plugin' ),
					icon: null,
					href: '#/institutions/new',
				},
			],
		} );
	}, [ setHeaderData ] );

	const fetchData = useCallback( () => {
		setIsLoading( true );
		apiFetch< Institution[] >( { path: `${ API_PATH }?per_page=100&context=edit` } )
			.then( setData )
			.finally( () => setIsLoading( false ) );
	}, [] );

	useEffect( () => {
		fetchData();
	}, [] );

	const fields: Field< Institution >[] = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: Institution } ) => item.title.raw,
				render: ( { item }: { item: Institution } ) => (
					<div>
						<strong>{ item.title.raw }</strong>
					</div>
				),
			},
			{
				id: 'description',
				label: __( 'Description', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: Institution } ) => item.excerpt.raw,
				render: ( { item }: { item: Institution } ) =>
					item.excerpt.raw ? <div className="newspack-institutions__description">{ item.excerpt.raw }</div> : null,
			},
			{
				id: 'email_domain',
				label: __( 'Email Domain', 'newspack-plugin' ),
				getValue: ( { item }: { item: Institution } ) => item.meta?.np_institution_email_domain || '',
				render: ( { item }: { item: Institution } ) => {
					const val = item.meta?.np_institution_email_domain;
					return val ? <code>{ val }</code> : <span className="newspack-institutions__empty">&mdash;</span>;
				},
			},
			{
				id: 'ip_range',
				label: __( 'IP Range', 'newspack-plugin' ),
				getValue: ( { item }: { item: Institution } ) => item.meta?.np_institution_ip_range || '',
				render: ( { item }: { item: Institution } ) => {
					const val = item.meta?.np_institution_ip_range;
					return val ? <code>{ val }</code> : <span className="newspack-institutions__empty">&mdash;</span>;
				},
			},
			{
				id: 'reader_data',
				label: __( 'Reader Data', 'newspack-plugin' ),
				getValue: ( { item }: { item: Institution } ) => item.meta?.np_institution_reader_data || '',
				render: ( { item }: { item: Institution } ) => {
					const val = item.meta?.np_institution_reader_data;
					return val ? <code>{ val }</code> : <span className="newspack-institutions__empty">&mdash;</span>;
				},
			},
		],
		[]
	);

	const actions: Action< Institution >[] = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'newspack-plugin' ),
				isPrimary: true,
				callback: ( items: Institution[] ) => {
					history.push( `/institutions/${ items[ 0 ].id }` );
				},
			},
			{
				id: 'delete',
				label: __( 'Delete', 'newspack-plugin' ),
				isDestructive: true,
				RenderModal: ( { items, closeModal }: { items: Institution[]; closeModal: () => void } ) => {
					const item = items[ 0 ];
					return (
						<div>
							<p>{ __( 'This will permanently delete this institution. This action cannot be undone.', 'newspack-plugin' ) }</p>
							<div style={ { display: 'flex', gap: '8px', justifyContent: 'flex-end' } }>
								<Button variant="tertiary" onClick={ closeModal }>
									{ __( 'Cancel', 'newspack-plugin' ) }
								</Button>
								<Button
									variant="primary"
									isDestructive
									onClick={ () => {
										apiFetch( { path: `${ API_PATH }/${ item.id }?force=true`, method: 'DELETE' } ).then( () => {
											fetchData();
											closeModal();
										} );
									} }
								>
									{ __( 'Delete', 'newspack-plugin' ) }
								</Button>
							</div>
						</div>
					);
				},
			},
		],
		[ fetchData, history ]
	);

	if ( ! isLoading && data.length === 0 ) {
		return (
			<div className="newspack-institutions__empty-state">
				<h3>{ __( 'No institutions yet', 'newspack-plugin' ) }</h3>
				<p>{ __( 'Use the "Add New" button above to create your first institution.', 'newspack-plugin' ) }</p>
			</div>
		);
	}

	return (
		<DataViews
			className="newspack-institutions"
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			actions={ actions }
			paginationInfo={ { totalItems: data.length, totalPages: 1 } }
			defaultLayouts={ { table: {}, grid: {} } }
			isLoading={ isLoading }
			getItemId={ ( item: Institution ) => String( item.id ) }
			search
		/>
	);
}
